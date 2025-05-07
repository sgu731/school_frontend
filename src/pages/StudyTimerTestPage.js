import React, { useState, useEffect } from 'react';

function StudyTimerTestPage() {
  const [subjectName, setSubjectName] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isStudying, setIsStudying] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [studyRecords, setStudyRecords] = useState([]);

  const token = localStorage.getItem('token');

  // 載入科目與歷史紀錄
  useEffect(() => {
    if (!token) return;

    // 取得科目
    fetch('http://localhost:5000/api/study/subjects', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setSubjects(data.subjects.map(s => ({ id: s.id, name: s.name })));
      })
      .catch(err => console.error('Error fetching subjects:', err));

    // 取得歷史紀錄
    fetch('http://localhost:5000/api/study/study-records', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        setStudyRecords(
          data.studyRecords.map(r => ({
            subject: r.subject_name,
            duration: r.duration,
          }))
        );
      })
      .catch(err => console.error('Error fetching study records:', err));
  }, [token]);

  // 計時器
  useEffect(() => {
    let timer;
    if (isStudying) {
      timer = setInterval(() => {
        setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStudying, startTime]);

  // 新增科目
  const handleAddSubject = () => {
    if (subjectName.trim() === '') return;
    fetch('http://localhost:5000/api/study/subjects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: subjectName }),
    })
      .then(res => res.json())
      .then(data => {
        setSubjects([...subjects, { id: data.subjectId, name: subjectName }]);
        setSubjectName('');
      })
      .catch(err => console.error('Error adding subject:', err));
  };

  // 開始讀書
  const startStudy = () => {
    if (!selectedSubject) return;
    setStartTime(Date.now());
    setIsStudying(true);
    setCurrentTime(0);
  };

  // 結束讀書
  const stopStudy = () => {
    const duration = Math.floor((Date.now() - startTime) / 1000);
    setIsStudying(false);

    fetch('http://localhost:5000/api/study/study-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subjectId: selectedSubject.id,
        duration,
      }),
    })
      .then(res => res.json())
      .then(data => {
        setStudyRecords([...studyRecords, {
          subject: selectedSubject.name,
          duration,
        }]);
      })
      .catch(err => console.error('Error saving study record:', err));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} 分 ${s} 秒`;
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>讀書計時器(測試用)</h1>

      <div>
        <input
          type="text"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
          placeholder="新增科目"
        />
        <button onClick={handleAddSubject}>新增</button>
      </div>

      <div>
        <select
          value={selectedSubject?.id || ''}
          onChange={(e) => {
            const subj = subjects.find(s => s.id === parseInt(e.target.value));
            setSelectedSubject(subj);
          }}
          disabled={isStudying}
        >
          <option value="">選擇科目</option>
          {subjects.map((subj) => (
            <option key={subj.id} value={subj.id}>{subj.name}</option>
          ))}
        </select>
      </div>

      <div>
        {!isStudying ? (
          <button onClick={startStudy} disabled={!selectedSubject}>開始讀書</button>
        ) : (
          <button onClick={stopStudy}>結束讀書</button>
        )}
      </div>

      <div>
        <h3>計時器：{formatTime(currentTime)}</h3>
      </div>

      <div>
        <h3>讀書紀錄</h3>
        <ul>
          {studyRecords.map((record, i) => (
            <li key={i}>{record.subject}：{formatTime(record.duration)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default StudyTimerTestPage;
