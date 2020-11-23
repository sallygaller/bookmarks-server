function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: "First bookmark",
      url: "www.bookmark1.com",
      description: "This is my first bookmark",
      rating: 5,
    },
    {
      id: 2,
      title: "Second bookmark",
      url: "www.bookmark2.com",
      description: "This is my second bookmark",
      rating: 1,
    },
    {
      id: 3,
      title: "Third bookmark",
      url: "www.bookmark3.com",
      description: "This is my third bookmark",
      rating: 2,
    },
    {
      id: 4,
      title: "Fourth bookmark",
      url: "www.bookmark4.com",
      description: "This is my fourth bookmark",
      rating: 2,
    },
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'This is a malicious bookmark! <script>alert("xss");</script>',
    url: "www.maliciousbookmark.com",
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 1,
  };
  const expectedBookmark = {
    ...maliciousBookmark,
    title:
      'This is a malicious bookmark! &lt;script&gt;alert("xss");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
  };
  return {
    maliciousBookmark,
    expectedBookmark,
  };
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark,
};
