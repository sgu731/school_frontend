import { useState } from 'react';
import SubjectList from '../components/SubjectList';
import NoteList from '../components/NoteList';

export default function KnowledgePage() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'left' }}>知識庫</h1>
        <input
          type="text"
          placeholder="搜尋"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {selectedSubject === null ? (
        <SubjectList onSelect={setSelectedSubject} searchTerm={searchTerm} />
      ) : (
        <NoteList subject={selectedSubject} onBack={() => setSelectedSubject(null)} />
      )}
    </div>
  );
}
