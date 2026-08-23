import { execFile } from 'child_process'
import { promisify } from 'util'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

const execFileAsync = promisify(execFile)

// Shells out to system `tesseract`/`pdftoppm` binaries (brew install tesseract
// poppler) rather than tesseract.js — materially better speed/accuracy for
// financial-document extraction where correctness matters, at the cost of a
// one-time native install. See /decisions/2026-08-22-lendstream-dsa-hub-architecture.md.
export async function extractText(fileBuffer: Buffer, mimeType: string | null): Promise<string> {
  const workDir = await mkdtemp(path.join(tmpdir(), 'lendstream-ocr-'))
  try {
    const isPdf = mimeType === 'application/pdf'
    if (isPdf) {
      const pdfPath = path.join(workDir, 'input.pdf')
      await writeFile(pdfPath, fileBuffer)
      const pagePrefix = path.join(workDir, 'page')
      await execFileAsync('pdftoppm', ['-png', '-r', '200', pdfPath, pagePrefix])

      const { readdir } = await import('fs/promises')
      const pageFiles = (await readdir(workDir)).filter((f) => f.startsWith('page') && f.endsWith('.png')).sort()

      const texts: string[] = []
      for (const pageFile of pageFiles) {
        texts.push(await ocrImage(path.join(workDir, pageFile)))
      }
      return texts.join('\n\n')
    }

    const ext = mimeType?.includes('png') ? 'png' : mimeType?.includes('webp') ? 'webp' : 'jpg'
    const imagePath = path.join(workDir, `input.${ext}`)
    await writeFile(imagePath, fileBuffer)
    return await ocrImage(imagePath)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function ocrImage(imagePath: string): Promise<string> {
  const outBase = imagePath.replace(/\.[^.]+$/, '')
  await execFileAsync('tesseract', [imagePath, outBase])
  return readFile(`${outBase}.txt`, 'utf-8')
}
