const documents = new Map();

function create(document) {
  documents.set(document.id, document);
  return document;
}

function findAllByOwner(ownerId) {
  return Array.from(documents.values()).filter((document) => document.ownerId === ownerId);
}

function findByIdAndOwner(id, ownerId) {
  const document = documents.get(id);
  return document?.ownerId === ownerId ? document : null;
}

module.exports = { create, findAllByOwner, findByIdAndOwner };