export async function downloadSessionPDF(markdownContent, dayData, session) {
  const html2pdf = (await import('html2pdf.js')).default;

  const sessionLabel = session === 'morning' ? 'Morning' : 'Evening';
  const title = `Day ${dayData.day} ${sessionLabel}`;
  const subtitle = session === 'morning' ? dayData.morning.title.en : dayData.evening.title.en;

  const styledHTML = generateStyledHTML(markdownContent, title, subtitle);

  const container = document.createElement('div');
  container.innerHTML = styledHTML;
  document.body.appendChild(container);

  const options = {
    margin: [10, 10, 10, 10],
    filename: `Day-${dayData.day}-${sessionLabel}_FullStackMastery.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  await html2pdf().set(options).from(container).save();
  document.body.removeChild(container);
}

export async function downloadDayPDF(dayData) {
  const html2pdf = (await import('html2pdf.js')).default;

  const title = `Day ${dayData.day}`;
  const subtitle = dayData.title.en;

  const combinedContent = `${dayData.morning.content}\n\n---\n\n${dayData.evening.content}`;
  const styledHTML = generateStyledHTML(combinedContent, title, subtitle);

  const container = document.createElement('div');
  container.innerHTML = styledHTML;
  document.body.appendChild(container);

  const options = {
    margin: [10, 10, 10, 10],
    filename: `Day-${dayData.day}_FullStackMastery.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  };

  await html2pdf().set(options).from(container).save();
  document.body.removeChild(container);
}

export async function downloadTeachingPlanPDF(phases, days) {
  const html2pdf = (await import('html2pdf.js')).default;

  const getWeekNum = (d) => Math.ceil(d / 7);

  let rows = '';
  phases.forEach(phase => {
    rows += `<tr><td colspan="5" style="background:${phase.color};color:white;padding:12px;font-weight:700;font-size:14px;border:none;border-radius:6px;">${phase.icon} ${phase.title} (Day ${phase.dayRange[0]}-${phase.dayRange[1]})</td></tr>`;

    const phaseDays = days.filter(d => d.phase === phase.id);
    let currentWeek = 0;
    phaseDays.forEach(day => {
      const w = getWeekNum(day.day);
      if (w !== currentWeek) {
        currentWeek = w;
        rows += `<tr><td colspan="5" style="background:#f1f5f9;padding:8px 12px;font-weight:700;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;border:1px solid #e2e8f0;">Week ${w}</td></tr>`;
      }
      const badges = `${day.isRevision ? ' ★' : ''}${day.isMiniProject ? ' 🏗️' : ''}`;
      const tags = day.topicTags.map(t => t).join(', ');
      rows += `<tr>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-weight:700;color:#6366f1;font-size:12px;white-space:nowrap;">Day ${day.day}${badges}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:12px;font-weight:600;">${day.title.en}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;color:#64748b;">${day.morning.title.en}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;color:#64748b;">${day.evening.title.en}</td>
        <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:10px;color:#94a3b8;">${tags}</td>
      </tr>`;
    });
  });

  const html = `
    <div style="font-family:Inter,system-ui,sans-serif;color:#1e293b;">
      <div style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;padding:24px;border-radius:8px;margin-bottom:20px;">
        <h1 style="margin:0;font-size:22px;color:white;">🚀 Full Stack Mastery — Teaching Plan</h1>
        <p style="margin:6px 0 0;opacity:0.85;font-size:13px;color:white;">90-Day Backend-Focused Program | Morning: Concepts (2hrs) | Evening: Practice (2hrs)</p>
      </div>
      <table style="border-collapse:collapse;width:100%;">
        <thead>
          <tr style="background:#1e293b;color:white;">
            <th style="padding:10px;font-size:11px;text-align:left;border:1px solid #334155;">Day</th>
            <th style="padding:10px;font-size:11px;text-align:left;border:1px solid #334155;">Topic</th>
            <th style="padding:10px;font-size:11px;text-align:left;border:1px solid #334155;">🌅 Morning</th>
            <th style="padding:10px;font-size:11px;text-align:left;border:1px solid #334155;">🌆 Evening</th>
            <th style="padding:10px;font-size:11px;text-align:left;border:1px solid #334155;">Tags</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:20px;text-align:center;font-size:10px;color:#94a3b8;">
        Full Stack Mastery - 90 Day Teaching Plan | Generated ${new Date().toLocaleDateString()}
      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);

  await html2pdf().set({
    margin: [8, 8, 8, 8],
    filename: 'FullStackMastery_90Day_TeachingPlan.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
  }).from(container).save();

  document.body.removeChild(container);
}

function generateStyledHTML(markdown, title, subtitle) {
  // Simple markdown to HTML conversion for PDF
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3 style="color:#6366f1;margin:16px 0 8px;font-size:14px;">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 style="color:#1e293b;margin:24px 0 12px;font-size:16px;border-bottom:1px solid #e2e8f0;padding-bottom:6px;">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 style="color:#1e293b;margin:0 0 16px;font-size:20px;">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#e0e7ff;color:#4338ca;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:12px;">$1</code>')
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre style="background:#1e293b;color:#e2e8f0;padding:12px;border-radius:6px;font-family:monospace;font-size:11px;overflow-x:auto;white-space:pre-wrap;margin:12px 0;"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    })
    // Blockquotes
    .replace(/^> (.*$)/gm, '<div style="border-left:3px solid #6366f1;padding:8px 12px;margin:8px 0;background:#f8fafc;border-radius:0 6px 6px 0;font-size:13px;">$1</div>')
    // Tables
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      if (cells.every(c => /^[-\s:]+$/.test(c))) return '';
      const tags = cells.map(c => `<td style="padding:6px 10px;border:1px solid #e2e8f0;font-size:12px;">${c.trim()}</td>`).join('');
      return `<tr>${tags}</tr>`;
    })
    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;">')
    // List items
    .replace(/^- (.*$)/gm, '<li style="margin:4px 0;font-size:13px;">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li style="margin:4px 0;font-size:13px;">$2</li>')
    // Paragraphs
    .replace(/^(?!<[hpuldtlirb])((?!^\s*$).+)$/gm, '<p style="margin:8px 0;font-size:13px;line-height:1.6;">$1</p>');

  // Wrap tables
  html = html.replace(/(<tr>[\s\S]*?<\/tr>)/g, '<table style="border-collapse:collapse;width:100%;margin:12px 0;">$1</table>');

  return `
    <div style="font-family:Inter,system-ui,sans-serif;color:#1e293b;max-width:100%;">
      <div style="background:linear-gradient(135deg,#6366f1,#4338ca);color:white;padding:20px;border-radius:8px;margin-bottom:20px;">
        <h1 style="margin:0;font-size:18px;color:white;">🚀 Full Stack Mastery</h1>
        <h2 style="margin:6px 0 0;font-size:22px;color:white;border:none;">${title}</h2>
        <p style="margin:4px 0 0;opacity:0.85;font-size:13px;color:white;">${subtitle}</p>
      </div>
      ${html}
      <div style="margin-top:24px;padding-top:12px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#94a3b8;">
        Full Stack Mastery - 90 Day Program | Generated ${new Date().toLocaleDateString()}
      </div>
    </div>
  `;
}
