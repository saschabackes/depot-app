import { useEffect, useRef } from 'react'

function generateQRMatrix(text) {
  const size = 21
  const matrix = Array.from({ length: size }, () => Array(size).fill(0))

  function setFinderPattern(row, col) {
    for (let r = 0; r < 7; r++)
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6
        const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4
        if (isBorder || isInner) matrix[row + r][col + c] = 1
      }
  }
  setFinderPattern(0, 0)
  setFinderPattern(0, size - 7)
  setFinderPattern(size - 7, 0)

  for (let i = 8; i < size - 8; i++) {
    matrix[6][i] = i % 2 === 0 ? 1 : 0
    matrix[i][6] = i % 2 === 0 ? 1 : 0
  }

  const bytes = new TextEncoder().encode(text)
  let bitIdx = 0
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col = 5
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < 2; c++) {
        const x = col - c
        const y = row
        if (matrix[y][x] !== 0) continue
        if (bitIdx < bytes.length * 8) {
          const byteIndex = Math.floor(bitIdx / 8)
          const bitIndex = 7 - (bitIdx % 8)
          matrix[y][x] = (bytes[byteIndex] >> bitIndex) & 1
          bitIdx++
        } else {
          matrix[y][x] = (y + x) % 2 === 0 ? 1 : 0
        }
      }
    }
  }
  return matrix
}

export function QRCodeSVG({ value, size = 120 }) {
  const matrix = generateQRMatrix(value)
  const cellSize = size / matrix.length
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <rect width={size} height={size} fill="white" />
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell ? <rect key={`${y}-${x}`} x={x * cellSize} y={y * cellSize}
            width={cellSize} height={cellSize} fill="black" /> : null
        )
      )}
    </svg>
  )
}

const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export default function QRLabel({ item, appUrl }) {
  const qrUrl = `${appUrl}/pantry/${item.id}`

  function handlePrint() {
    const printWindow = window.open('', '_blank', 'width=400,height=300')
    if (!printWindow) return
    const name = escapeHtml(item.name)
    const unit = escapeHtml(item.unit)
    const quantity = Number(item.quantity) || 0
    printWindow.document.write(`<!DOCTYPE html><html><head>
      <title>QR-Etikett: ${name}</title>
      <style>
        @page { size: 62mm 30mm; margin: 2mm; }
        body { font-family: -apple-system, sans-serif; margin: 0; padding: 4mm; display: flex; gap: 3mm; align-items: center; }
        .qr { flex-shrink: 0; }
        .info { font-size: 9pt; line-height: 1.3; }
        .name { font-weight: bold; font-size: 10pt; }
        .mhd { color: #666; }
      </style>
    </head><body>
      <div class="qr">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrUrl)}" width="80" height="80" />
      </div>
      <div class="info">
        <div class="name">${name}</div>
        ${item.bestBefore ? `<div class="mhd">MHD: ${escapeHtml(new Date(item.bestBefore).toLocaleDateString('de-DE'))}</div>` : ''}
        ${quantity > 1 ? `<div>${quantity}× ${unit}</div>` : ''}
      </div>
    </body></html>`)
    printWindow.document.close()
    setTimeout(() => { printWindow.print(); printWindow.close() }, 500)
  }

  return (
    <button onClick={handlePrint}
      className="flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full font-semibold hover:bg-gray-200 dark:hover:bg-gray-600"
      title="QR-Etikett drucken">
      🏷️ QR drucken
    </button>
  )
}
