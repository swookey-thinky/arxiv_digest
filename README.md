# Arxiv Digest

Try it here: [Arxiv Digest](https://arxiv-digest.vercel.app/)

Staying up to date on arXiv papers can take a considerable amount of time, with on the order of hundreds of new papers each day to filter through. There is an [official daily digest service](https://info.arxiv.org/help/subscribe.html), however large categories like cs.AI still have 50-100 papers a day. Determining if these papers are relevant and important to you means reading through the title and abstract, which is time-consuming.

I've needed a better way to triage new research published on Arxiv, so I present [Arxiv Digest](https://arxiv-digest.vercel.app/). By default, it will show you the papers published in the last day using a default query (Language Modeling in this case). You can add tags to help you triage different papers, filter by tags to see only the papers with those tags, click through to the paper on arxiv, setup custom queries, and search by keyword or title. It uses Google for authentication, and the only reason its a logged in experience is to remember the tags you have created for each paper, and any custom search queries you have saved.

Recently we added the ability to browse papers listed on [Hugging Face Daily Papers](https://huggingface.co/papers), so that you can track and triage them as well.

I built this for myself, but if you have any issues or requests feel free to post them here. Would be nice to make it useful to other people.

## Privacy Policy

This is a tool for my personal use, but feel free to use it for yourself. I don't care who you are, so your data is never looked at, never sold, never paid attention to. 
## Fun Fact

This website was entirely created with [Bolt](https://bolt.new) and [Cursor](https://www.cursor.com/). They are pretty freaking cool, and I have written no Javascript code to support this.
