const { before, after, test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

let app;
let server;
let baseUrl;
let storageDirectory;
let previousStorageDirectory;

before(async () => {
  storageDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-storage-'));
  previousStorageDirectory = process.env.STORAGE_DIR;
  process.env.STORAGE_DIR = storageDirectory;
  app = require('../src/app');
  server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await fs.rm(storageDirectory, { recursive: true, force: true });

  if (previousStorageDirectory === undefined) {
    delete process.env.STORAGE_DIR;
  } else {
    process.env.STORAGE_DIR = previousStorageDirectory;
  }
});

test('o app backend é exportado', () => {
  assert.ok(app, 'o app deve estar definido');
  assert.strictEqual(typeof app, 'function', 'o app Express deve ser uma função');
});

test('faz upload, lista e baixa um documento', async () => {
  const form = new FormData();
  form.append('file', new Blob(['conteudo de teste'], { type: 'text/plain' }), 'nota.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: form });
  assert.strictEqual(uploadResponse.status, 201);
  const { document } = await uploadResponse.json();
  assert.strictEqual(document.originalName, 'nota.txt');
  assert.strictEqual(document.size, 17);
  assert.ok(document.id);
  assert.strictEqual('storagePath' in document, false);

  const listResponse = await fetch(`${baseUrl}/documents`);
  assert.strictEqual(listResponse.status, 200);
  const { documents } = await listResponse.json();
  assert.strictEqual(documents.length, 1);
  assert.strictEqual(documents[0].id, document.id);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`);
  assert.strictEqual(downloadResponse.status, 200);
  assert.strictEqual(await downloadResponse.text(), 'conteudo de teste');
  assert.match(downloadResponse.headers.get('content-disposition'), /attachment/);
});

test('retorna erros para arquivo ausente e documento inexistente', async () => {
  const uploadResponse = await fetch(`${baseUrl}/upload`, { method: 'POST', body: new FormData() });
  assert.strictEqual(uploadResponse.status, 400);

  const downloadResponse = await fetch(`${baseUrl}/documents/inexistente/download`);
  assert.strictEqual(downloadResponse.status, 404);
});
