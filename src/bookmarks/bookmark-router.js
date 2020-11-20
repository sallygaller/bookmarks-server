const express = require("express");
const { v4: uuid } = require("uuid");
const logger = require("../logger");
const { bookmarks } = require("../store");
const BookmarksService = require("./bookmarks-service");

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const createBookmark = (bookmark) => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  rating: bookmark.rating,
});

bookmarkRouter
  .route("/bookmarks")
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get("db")).then((bookmarks) => {
      res.json(bookmarks.map(createBookmark));
    });
  })
  .post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;
    //validate that both the title and url exist
    if (!title) {
      logger.error(`Title is required`);
      return res.status(400).send("Invalid data");
    }
    if (!url) {
      logger.error(`URL is required`);
      return res.status(400).send("Invalid data");
    }
    if (!rating) {
      logger.error(`A rating is required`);
      return res.status(400).send("Invalid data");
    }
    if (rating < 1 || rating > 5) {
      logger.error(`Rating must be between 1 and 5`);
      return res.status(400).send("Invalid data");
    }
    //if they exist, generate an ID
    const id = uuid();
    const bookmark = { id, title, url, description, rating };
    //push new bookmark object into the array
    bookmarks.push(bookmark);

    logger.info(`Bookmark with id ${id} created.`);
    res
      .status(201)
      .location(`http://localhost:8000/bookmarks/${id}`)
      .json(bookmark);
  });

bookmarkRouter
  .route("/bookmarks/:id")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    const bookmark_id = req.params.id;
    BookmarksService.getById(knexInstance, bookmark_id)
      .then((bookmark) => {
        let selectedBookmark = bookmark[0];
        if (!selectedBookmark) {
          logger.error(`Bookmark with id ${bookmark_id} not found.`);
          return res.status(404).json({
            error: { message: `Bookmark not found` },
          });
        }
        res.json(createBookmark(selectedBookmark));
      })
      .catch(next);
  })
  .delete((req, res) => {
    const { id } = req.params;
    const bookmarkIndex = bookmarks.findIndex((b) => b.id == id);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send("Bookmark not found.");
    }
    bookmarks.splice(bookmarkIndex, 1);
    logger.info(`Bookmark with id ${id} deleted.`);
    res.status(204).end();
  });

module.exports = bookmarkRouter;
