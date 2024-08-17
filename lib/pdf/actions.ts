'use server'
import pdf from 'pdf-parse'

export async function readPdf(uint8Array: any) {
  // Create a Buffer from the Uint8Array
  const buffer = Buffer.from(uint8Array)

  // Parse the PDF
  const data = await pdf(buffer)
  return data.text
}
