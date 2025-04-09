const notes = [
    { id: 1, title: 'C 筆記 3', type: '文字', updated: 'today' },
    { id: 2, title: 'Python Chapter1', type: '影片', updated: 'yesterday' },
  ];
  
  export default function NoteList({ subject, onBack }) {
    return (
      <div style={{ padding: '16px' }}>
        <button
          onClick={onBack}
          style={{
            marginBottom: '16px',
            color: 'black', 
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          &larr; 返回
        </button>
  
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 'bold',
            marginBottom: '12px',
            textAlign: 'left',
          }}
        >
          {subject} 筆記
        </h2>
  
        <div style={{ marginBottom: '16px' }}>
          <button style={buttonStyle}>文字</button>
          <button style={buttonStyle}>圖片</button>
          <button style={buttonStyle}>影片</button>
          <button style={buttonStyle}>語音</button>
        </div>
  
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {notes.map(note => (
            <div
              key={note.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '12px',
                width: '200px',
              }}
            >
              <div
                style={{
                  height: '96px',
                  backgroundColor: '#ddd',
                  marginBottom: '8px',
                  borderRadius: '4px',
                }}
              />
              <h3 style={{ margin: '4px 0' }}>{note.title}</h3>
              <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>
                Updated {note.updated}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  const buttonStyle = {
    padding: '6px 12px',
    marginRight: '8px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#fff',
    cursor: 'pointer',
  };
  