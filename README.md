# Blog

This repository hosts the source code of my personal blog, made with [Zola](https://www.getzola.org/).

The template used is [Apollo](https://github.com/not-matthias/apollo).

Analytics are managed with [Umami](umami.is) ([dashboard](https://eu.umami.is/websites/7141a5d9-837a-4daa-96f1-b22e8a3f3a1b)).

# Serving

```shell
zola serve
```

# Differences with the original template
1. The templates/partials/header.html has been overridden to allow using a webmanifest for the favicon, generated with [realfavicongenerator](https://realfavicongenerator.net).
2. The linkshelf template is based on the talks template from Apollo.

# Useful resources for development
- https://github.com/not-matthias/not-matthias.github.io the blog of the theme author
- https://github.com/not-matthias/apollo the repository of the theme