const knex = require("knex");
const {
  makeBookmarksArray,
  makeMaliciousBookmark,
} = require("./bookmarks-fixtures");
const app = require("../src/app");
const supertest = require("supertest");
const { expect } = require("chai");

describe("Bookmarks Endpoints", () => {
  let db;

  before("make knex instance", () => {
    db = knex({
      client: "pg",
      connection: process.env.TEST_DB_URL,
    });
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => db("bookmarks").truncate());

  afterEach("cleanup", () => db("bookmarks").truncate());

  describe(`Unauthorized requests`, () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach("insert bookmarks", () => {
      return db.into("bookmarks").insert(testBookmarks);
    });

    it("responds with 401 Unauthorized for GET /bookmarks", () => {
      return supertest(app)
        .get(`/bookmarks`)
        .expect(401, { error: "Unauthorized request" });
    });

    it("responds with 401 Unauthorized for POST /bookmarks", () => {
      return supertest(app)
        .post(`/bookmarks`)
        .send({
          title: "Test bookmark",
          url: "www.test-bookmark.com",
          rating: 5,
        })
        .expect(401, { error: "Unauthorized request" });
    });

    it("responds with 401 Unauthorized for GET /bookmarks/:id", () => {
      const secondBookmark = testBookmarks[1];
      return supertest(app)
        .get(`/bookmarks/${secondBookmark.id}`)
        .expect(401, { error: "Unauthorized request" });
    });

    it("responds with 401 Unauthorized for DELETE /bookmarks/:id", () => {
      const aBookmark = testBookmarks[1];
      return supertest(app)
        .delete(`/bookmarks/${aBookmark.id}`)
        .expect(401, { error: "Unauthorized request" });
    });
  });

  describe("GET /bookmarks", () => {
    context("Given no bookmarks", () => {
      it("responds with 200 and an empty list", () => {
        return supertest(app)
          .get("/bookmarks")
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });

    context("Given an XSS attack bookmark", () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      beforeEach("insert malicious bookmark", () => {
        return db.into("bookmarks").insert([maliciousBookmark]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("gets the bookmarks", () => {
        return supertest(app)
          .get(`/bookmarks`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      });
    });
  });

  describe("GET /bookmarks/:id", () => {
    context("Given no bookmarks", () => {
      it("responds 404 when bookmark doesn't exist", () => {
        return supertest(app)
          .get(`/bookmarks/123`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not Found` },
          });
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("responds with 200 and the specified bookmark", () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });
    });

    context("Given an XSS attack bookmark", () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      beforeEach("insert malicious bookmark", () => {
        return db.into("bookmarks").insert([maliciousBookmark]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  describe("DELETE /bookmarks/:id", () => {
    context("Given no bookmarks", () => {
      it("responds 404 whe bookmark doesn't exist", () => {
        return supertest(app)
          .delete(`/bookmarks/123`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not Found` },
          });
      });
    });

    context("Given there are bookmarks in the database", () => {
      const testBookmarks = makeBookmarksArray();

      beforeEach("insert bookmarks", () => {
        return db.into("bookmarks").insert(testBookmarks);
      });

      it("removes the bookmark by ID", () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(
          (bm) => bm.id !== idToRemove
        );
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(() =>
            supertest(app)
              .get(`/bookmarks`)
              .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
              .expect(expectedBookmarks)
          );
      });
    });
  });

  describe("POST /bookmarks", () => {
    it("responds with 400 invalid 'rating' if not between 1 and 5", () => {
      const newBookmarkInvalidRating = {
        title: "Test bookmark",
        url: "www.test-bookmark.com",
        rating: 7,
      };
      return supertest(app)
        .post(`/bookmarks`)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmarkInvalidRating)
        .expect(400, {
          error: { message: `'rating' must be a number between 1 and 5` },
        });
    });

    const requiredFields = ["title", "url", "rating"];

    requiredFields.forEach((field) => {
      const newBookmark = {
        title: "Test bookmark",
        url: "www.test-bookmark.com",
        rating: 5,
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field];

        return supertest(app)
          .post(`/bookmarks`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` },
          });
      });
    });

    context("Given an XSS attack bookmark", () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      beforeEach("insert malicious bookmark", () => {
        return db.into("bookmarks").insert([maliciousBookmark]);
      });

      it("removes XSS attack content", () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });

    it("creates a bookmark, responding with 201 and the new bookmark", () => {
      const newBookmark = {
        title: "Test bookmark",
        url: "www.test-bookmark.com",
        description: "Test bookmark description",
        rating: 5,
      };
      return supertest(app)
        .post(`/bookmarks`)
        .send(newBookmark)
        .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property("id");
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`);
        })
        .then((res) =>
          supertest(app)
            .get(`/bookmarks/${res.body.id}`)
            .set("Authorization", `Bearer ${process.env.API_TOKEN}`)
            .expect(res.body)
        );
    });
  });
});
