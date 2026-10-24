/**
 * Robust Optical ERP Print Utility
 * Handles printing of invoices, job cards, optical prescription matrices,
 * and barcode labels cleanly without printing web UI chrome (navbars, sidebars, buttons, etc.).
 * Works reliably inside iframes and standard browser tabs.
 */

export interface PrintOptions {
  title?: string;
  landscape?: boolean;
  pageMargin?: string;
  customStyles?: string;
}

export function printElementById(elementId: string, options: PrintOptions = {}): boolean {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Print Error: Element with id "${elementId}" not found.`);
    // Fallback to window.print()
    window.print();
    return false;
  }

  return printHtml(element.innerHTML, options);
}

export function printHtml(htmlContent: string, options: PrintOptions = {}): boolean {
  const {
    title = 'Modina Optics ERP - Optical Glazing Document',
    landscape = false,
    pageMargin = '8mm',
    customStyles = '',
  } = options;

  // Extract all stylesheets from current document to preserve Tailwind CSS & FontAwesome styling
  const styleElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  let stylesHtml = '';

  styleElements.forEach((el) => {
    stylesHtml += el.outerHTML;
  });

  // Ensure Tailwind & FontAwesome CDN fallbacks are present in print frame
  const headIncludes = `
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${stylesHtml}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" crossorigin="anonymous" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      @page {
        size: ${landscape ? 'landscape' : 'portrait'};
        margin: ${pageMargin};
      }
      *, *::before, *::after {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 12px;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .no-print {
        display: none !important;
      }
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      th, td {
        border-color: #cbd5e1 !important;
      }
      ${customStyles}
    </style>
  `;

  const fullPrintDoc = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      ${headIncludes}
    </head>
    <body class="bg-white text-slate-900">
      <div class="print-container">
        ${htmlContent}
      </div>
      <script>
        window.addEventListener('load', function() {
          setTimeout(function() {
            window.focus();
            window.print();
          }, 350);
        });
      </script>
    </body>
    </html>
  `;

  // Strategy 1: Hidden Iframe (Cleanest, does not pop up new windows)
  try {
    const existingFrame = document.getElementById('modina-print-iframe');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'modina-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(fullPrintDoc);
      doc.close();

      iframe.contentWindow?.focus();
      setTimeout(() => {
        try {
          iframe.contentWindow?.print();
        } catch (iframeErr) {
          console.warn('Iframe print failed, falling back to window.print', iframeErr);
          window.print();
        }
      }, 500);

      return true;
    }
  } catch (err) {
    console.warn('Print iframe creation error, falling back to clean popup window:', err);
  }

  // Strategy 2: Popup Window Fallback
  try {
    const printWindow = window.open('', '_blank', 'width=800,height=900,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullPrintDoc);
      printWindow.document.close();
      printWindow.focus();
      return true;
    }
  } catch (popupErr) {
    console.warn('Print popup blocked or failed:', popupErr);
  }

  // Strategy 3: Standard window.print()
  window.print();
  return true;
}
