// Verkleinert ein Foto für den Upload: längste Kante höchstens 1600 px, JPEG, meist 200–400 KB.
// Der Brief bleibt lesbar, und ein Handyfoto mit mehreren MB belastet weder Mobilfunk noch Speicher.
const MAX_EDGE = 1600
const QUALITY = 0.8

export async function compressImage(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('Das Bild konnte nicht gelesen werden.')); img.src = url })
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(img.naturalWidth * scale)
    canvas.height = Math.round(img.naturalHeight * scale)
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', QUALITY))
    if (!blob) throw new Error('Das Bild konnte nicht verkleinert werden.')
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
