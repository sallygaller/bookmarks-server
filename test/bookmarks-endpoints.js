const { expect } = require("chai");
const knex = require("knex");
const supertest = require("supertest");
const app = require("../src/app");
const fixtures = require("./bookmarks-fixtures");
const store = require("../src/store");

describe.only("Bookmarks Endpoints", function () {
  let bookmarks, db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });
  after("disconnect from db", () => db.destroy());
  before("clean the table", () => db("bookmarks").truncate());
  afterEach("cleanup", () => db("bookmarks").truncate());

  beforeEach("copy the bookmarks", () => {
    bookmarksCopy = store.bookmarks.slice();
  });

  //copy bookmarks store
  afterEach("restore the bookmarks", () => {
    store.bookmarks = bookmarksCopy;
  });

  describe("GET /bookmarks", () => {
    context("Given no bookmarks", () => {
      it("Responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = fixtures.makeBookmarksArray();
      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("GET /bookmarks responds with 200 and all of the bookmarks", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200);
      });
    });
    describe("GET /bookmarks/:bookmark_id", () => {
      context("Given no bookmarks", () => {
        it("responds with 404", () => {
          const bookmarkId = 123456;
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(404, { error: { message: `Bookmark not found` } });
        });
      });

      context("Given there are bookmarks in the database", () => {
        const testBookmarks = fixtures.makeBookmarksArray();
        beforeEach("insert bookmarks", () => {
          return db.into("bookmarks").insert(testBookmarks);
        });
        it("Responds with 200 and the correct bookmark", () => {
          const bookmarkId = 2;
          const expectedBookmark = testBookmarks[bookmarkId - 1];
          return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(200, expectedBookmark);
        });
      });
    });
  });
});
