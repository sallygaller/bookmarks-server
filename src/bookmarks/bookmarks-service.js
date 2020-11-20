const BookmarksService = {
  getAllBookmarks(knex) {
    return knex.select("*").from("bookmarks");
  },
  insertBookmark(knex, newBookmark) {
    return knex
      .insert(newBookmark)
      .into("bookmarks")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },
  getById(knex, id) {
    console.log(id);
    return knex.from("bookmarks").select("*").where("id", id);
  },
  deleteBookmark(knex, id) {
    return knex("bookmarks").where({ id }).delete();
  },
  updateBookmark(knex, id, newBookmarkFields) {
    return knex("bookmarks").where({ id }).update(newBookmarkFields);
  },
};

module.exports = BookmarksService;
