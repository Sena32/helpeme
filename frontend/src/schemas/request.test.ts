import { disguisedExecutable, jpegFile, pdfFile, pngFile } from '@/test/files';
import { createRequestSchema, MAX_ATTACHMENT_BYTES, validateAttachment } from './request';

const valid = { title: 'Notebook sem rede', categoryId: 'cat-1', description: 'd'.repeat(50) };
const messagesOf = (input: object) => {
  const result = createRequestSchema.safeParse(input);
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [String(issue.path[0]), issue.message]),
  );
};

describe('createRequestSchema (RN-05)', () => {
  it.each([
    [49, 'A descrição deve ter entre 50 e 1000 caracteres.'],
    [1001, 'A descrição deve ter entre 50 e 1000 caracteres.'],
  ])('AC-11: rejects a description with %i chars', (length, message) => {
    expect(messagesOf({ ...valid, description: 'd'.repeat(length) }).description).toBe(message);
  });

  it.each([50, 1000])('accepts a description with %i chars', (length) => {
    expect(messagesOf({ ...valid, description: 'd'.repeat(length) })).toEqual({});
  });

  it('counts the description after trimming', () => {
    expect(
      messagesOf({ ...valid, description: `  ${'d'.repeat(49)}  ` }).description,
    ).toBeDefined();
  });

  it('requires a title of 5 to 120 chars and a category', () => {
    expect(messagesOf({ ...valid, title: 'abcd', categoryId: '' })).toEqual({
      title: 'O título deve ter entre 5 e 120 caracteres.',
      categoryId: 'Selecione uma categoria.',
    });
    expect(messagesOf({ ...valid, title: 't'.repeat(121) }).title).toBeDefined();
  });
});

describe('validateAttachment (RN-06)', () => {
  it('accepts PNG and JPEG images up to 5 MB', async () => {
    await expect(
      validateAttachment(pngFile('grande.png', MAX_ATTACHMENT_BYTES)),
    ).resolves.toBeNull();
    await expect(validateAttachment(jpegFile())).resolves.toBeNull();
  });

  it('AC-12: rejects other types and disguised files', async () => {
    await expect(validateAttachment(pdfFile())).resolves.toBe(
      'doc.pdf: envie apenas imagens JPG ou PNG.',
    );
    await expect(validateAttachment(disguisedExecutable())).resolves.toBe(
      'virus.png: o conteúdo não é uma imagem JPG ou PNG válida.',
    );
  });

  it('AC-13: rejects a file of 5 MB + 1 byte', async () => {
    await expect(validateAttachment(pngFile('grande.png', MAX_ATTACHMENT_BYTES + 1))).resolves.toBe(
      'grande.png: o arquivo excede 5 MB.',
    );
  });
});
