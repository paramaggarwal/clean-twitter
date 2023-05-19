/*********************************************
 * Code builds upon this script
 * https://github.com/vincentmvdm/for-me-page
 * shared under the MIT License.
 *********************************************/

/* CONSTANTS */
const STORAGE_KEY = "OPENAI_API_KEY";
const HELP_MSG = "Help me find one!";
const HELP_URL =
  "https://www.howtogeek.com/885918/how-to-get-an-openai-api-key/";

let OPENAI_API_KEY = localStorage.getItem(STORAGE_KEY);

// Change these topics to match your taste.
const BAD_TOPICS = [
  "Politics",
  "Hate speech",
  "Here is why lists",
  "Promoted tweets",
];

const MIN_TWEETS_PER_REVIEW = 3; // Min # of tweets needed before we contact OpenAI
const MAX_TWEETS_PER_REVIEW = 30; // Max # of tweets to include in a single API request (avoids token limits)
const REVIEW_INTERVAL_MS = 25;

const seenTweets = {};
let tweetsToReview = [];

start();

function start() {
  if (!OPENAI_API_KEY) {
    const key = prompt("Add your OpenAI key to filter your tweets", HELP_MSG);
    if (key === HELP_MSG) {
      window.open(HELP_URL, "_blank");
      return;
    }

    if (key?.length < 40) {
      alert("Invalid API key, please check again.");
      return;
    }

    OPENAI_API_KEY = key;
    localStorage.setItem(STORAGE_KEY, key);
  }

  addMutationObserver();
  setInterval(reviewTweets, REVIEW_INTERVAL_MS);
}

function addMutationObserver() {
  // Grab any tweets from the mutations if we haven't seen them
  // before and queue them up for review. There's likely a better
  // way to do this but I was in a hurry.
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      const tweets = [
        ...mutation.target.querySelectorAll("article[data-testid='tweet']"),
      ]
        .map(extractTweet)
        .filter((tweet) => tweet !== undefined && tweet.text.length !== 0);

      tweets.forEach((tweet) => {
        if (seenTweets[tweet.id] !== undefined) {
          return;
        }

        seenTweets[tweet.id] = tweet;
        tweetsToReview.push(tweet);
      });
    });
  });
  observer.observe(document.body, { subtree: true, childList: true });
}

async function reviewTweets() {
  const numberOfReviews = Math.ceil(
    tweetsToReview.length / MAX_TWEETS_PER_REVIEW
  );

  for (let i = 0; i < numberOfReviews; i++) {
    if (tweetsToReview.length < MIN_TWEETS_PER_REVIEW) {
      break;
    }

    const currentReview = tweetsToReview.splice(0, MAX_TWEETS_PER_REVIEW);

    try {
      const badTweets = await identifyBadTweets(currentReview);
      console.log("\n");
      console.log(
        `Reviewed ${
          currentReview.length
        } tweets at ${new Date().toLocaleString()}`
      );
      badTweets.forEach(({ id, topic }) => removeTweet(id, topic));
    } catch (e) {
      console.log(`Error: ${e}`);
    }
  }
}

async function identifyBadTweets(currentReview) {
  const requestPayload = {
    model: "gpt-3.5-turbo",
    messages: buildPrompt(currentReview),
    temperature: 0,
    max_tokens: 2000,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(requestPayload),
  });

  const data = await response.json();

  if (data.choices.length === 0) {
    return [];
  }

  return JSON.parse(data.choices[0].message.content);
}

function buildPrompt(currentReview) {
  return [
    {
      role: "user",
      content: `Review the JSON list of tweets below and identify the ones related to the topics below. Return a JSON array with objects containing keys "id" and "topic", where "id" is the id of the tweet and "topic" is the name of the topic it relates to. DON'T include only slightly related or unrelated tweets. If no tweets match, return an empty array.

Topics:
"""
${BAD_TOPICS.map((topic, i) => `${i + 1}. ${topic}`).join("\n")}
"""

Tweets to review:
"""
${JSON.stringify(
  currentReview.map((tweet) => {
    const { ref, ...rest } = tweet;
    return rest;
  })
)}
"""

Now return a JSON array. DON'T add any text before/after the JSON array. Something terrible will happen if you don't follow these precise instructions.`,
    },
  ];
}

function removeTweet(id, topic) {
  const tweet = seenTweets[id];

  if (tweet === undefined) {
    console.log(`Error: couldn't find bad tweet ${id}`);
    return;
  }

  console.log("\n");
  console.log(`Removed tweet ${tweet.id}`);
  console.log(`Text: ${tweet.text}`);
  console.log(`Topic: ${topic}`);

  // TODO: Make sure that Twitter doesn't reset this styling
  // change when the user e.g. scrolls back up
  tweet.ref.style.opacity = 0.1;
}

function extractTweet(elem) {
  const textElem = elem.querySelector("div[data-testid='tweetText']");

  if (!textElem) {
    return undefined;
  }

  const text = textElem.textContent;

  return {
    // Generate a unique id for each tweet ourselves because
    // Twitter's HTML doesn't have good IDs we can use.
    id: hashStringToId(text),
    text: formatTweetText(text),
    // Include a ref to the DOM element for easy manipulation.
    ref: elem,
  };
}

// Removes white space/truncates tweet text
function formatTweetText(text) {
  const formattedText = text.replace(/\n/g, " ").trim();
  const charLimit = 240;

  if (formattedText.length > charLimit) {
    return `${formattedText.slice(0, charLimit)}…`;
  }

  return formattedText;
}

// Generates a unique ID for a string
function hashStringToId(str) {
  let hash = 5381;
  let i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i);
  }

  return hash >>> 0;
}
