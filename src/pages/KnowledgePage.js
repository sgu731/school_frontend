import React, { useState } from 'react';
import SubjectList from '../components/SubjectList';
import NoteList from '../components/NoteList';
import ResourceSidebar from '../components/ResourceSidebar';

function KnowledgePage() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-8 max-w-[1200px] mx-auto">
      {/* 標題 + 搜尋列 */}
      <h1 className="text-2xl font-bold mb-4">知識庫</h1>
      <input
        type="text"
        placeholder="搜尋科目或筆記"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full mb-6 px-3 py-2 border rounded"
      />

      {/* 三欄版面：科目 / 筆記 / 外部資源 */}
      <div className="grid grid-cols-[260px_1fr_320px] gap-6">
        {/* 左側：科目清單 */}
        <aside className="overflow-y-auto">
          <SubjectList
            searchTerm={searchTerm}
            activeId={selectedSubject?.id}
            onSelect={(subject) => setSelectedSubject(subject)}
          />
        </aside>

        {/* 中間：筆記清單或提示 */}
        <main className="min-h-[400px]">
          {selectedSubject ? (
            <NoteList
              subject={selectedSubject}
              onBack={() => setSelectedSubject(null)}
              searchTerm={searchTerm}
            />
          ) : (
            <p className="text-gray-500">請在左側選擇科目以檢視筆記</p>
          )}
        </main>

        {/* 右側：維基／相關連結 */}
        {selectedSubject && (
          <ResourceSidebar subjectName={selectedSubject.name} />
        )}
      </div>
    </div>
  );
}

export default KnowledgePage;
