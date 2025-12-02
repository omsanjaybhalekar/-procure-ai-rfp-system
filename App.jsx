import React, { useState } from 'react';

export default function App(){
  const [text,setText] = useState('');
  const [rfp, setRfp] = useState(null);
  const [sending, setSending] = useState(false);

  async function createRfp(){
    const resp = await fetch('http://localhost:4000/api/rfps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await resp.json();
    setRfp(data);
  }

  async function sendToVendor(){
    if (!rfp) return alert('Create RFP first');
    setSending(true);
    const resp = await fetch(`http://localhost:4000/api/rfps/${rfp.id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendorId: 'vendor-1', message: 'Please quote' })
    });
    const data = await resp.json();
    alert('Sent: ' + JSON.stringify(data));
    setSending(false);
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>ProcureAI - Demo</h1>
      <textarea rows={6} cols={80} value={text} onChange={e=>setText(e.target.value)} placeholder="Type RFP in plain English..."></textarea><br/>
      <button onClick={createRfp} style={{ marginTop: 8 }}>Create Structured RFP</button>

      {rfp && (
        <div style={{ marginTop: 20 }}>
          <h3>Structured RFP</h3>
          <pre style={{ background: '#f0f0f0', padding: 10 }}>{JSON.stringify(rfp, null, 2)}</pre>
          <button onClick={sendToVendor} disabled={sending}>Send to Demo Vendor</button>
        </div>
      )}
    </div>
  );
}
