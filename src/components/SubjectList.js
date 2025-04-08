const subjects = ['C', 'JAVA', 'Python', '資料結構'];

export default function SubjectList({ onSelect, searchTerm }) {
  const filteredSubjects = subjects.filter(subject =>
    subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
    {filteredSubjects.map(subject => (
        <div
        key={subject}
        onClick={() => onSelect(subject)}
        style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '16px',
            width: 'calc(33.33% - 11px)', // 三等分 + 排除間距
            boxSizing: 'border-box',
            cursor: 'pointer',
        }}
        >
        <div
            style={{
            height: '96px',
            backgroundColor: '#ddd',
            marginBottom: '8px',
            borderRadius: '6px',
            }}
        />
        <p style={{ margin: 0 }}>{subject}</p>
        </div>
    ))}
    </div>

  );
}
