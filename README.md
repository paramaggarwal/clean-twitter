# Clean Twitter - Chrome Extension
Dim unwanted tweets on your Twitter For You page using GPT.

Hide tweets | Skip mute lists | Uses OpenAI
--- | --- | ---
![Hide tweets](/screenshots/1.png) | ![Skip mute lists](/screenshots/2.png) | ![Uses OpenAI](/screenshots/3.png)

## Install

- The Chrome Extension is currently under review - submitted on 19th May 2023.
- Meanwhile you can [install the extension manually](https://webkul.com/blog/how-to-install-the-unpacked-extension-in-chrome/).

## Topics

1. Politics
2. Hate speech
3. Here is why lists
4. Promoted tweets

## Benefits

1. Filter tweets on your For You timeline.
2. No need to maintain large block lists.
3. Let AI determine matching of topics against tweets.

## Limitations and bugs
* The boost only dims bad tweets temporarily and e.g. the styling gets lost when the user scrolls back up
* GPT turbo isn't always smart enough and frequently misclassifies tweets (e.g. labels any tweet about AI as 'bad')
    * An easy solution is using GPT-4 but that could require modifications to the prompt for the best results
* It doesn't know about a tweet's images, author, etc.
* I haven't done the math on how expensive this would be to run constantly :)

## Credit

Uses the [Arc Boost script](https://github.com/vincentmvdm/for-me-page) shared by [Vincent van der Meulen](https://twitter.com/vincentmvdm), modified [with permission](https://twitter.com/vincentmvdm/status/1659388675682123776). See the [original tweet](https://twitter.com/vincentmvdm/status/1658678049691385857).
