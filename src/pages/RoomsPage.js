import React, { useState, useEffect } from 'react';

function RoomsPage() {
  const [roomName, setRoomName] = useState(''); // �Ω�Ыةж����W��
  const [allRooms, setAllRooms] = useState([]); // �������ж��C��
  const [currentRoom, setCurrentRoom] = useState(null); // �ϥΪ̷�e�[�J���ж�
  const [message, setMessage] = useState(''); // �Ω���ܮ���

  // ����������ж��C��
  const fetchAllRooms = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/study/rooms/all', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setAllRooms(data.rooms);
    }
  };

  // ����ϥΪ̷�e�[�J���ж�
  const fetchCurrentRoom = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/study/rooms/current', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      setCurrentRoom(data.room);
    }
  };

  // �Ыةж�
  const createRoom = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:5000/api/study/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: roomName }),
    });

    const data = await response.json();
    if (response.ok) {
      setMessage('Room created successfully');
      setRoomName(''); // �M�ſ�J��
      fetchAllRooms(); // ��s�������ж��C��
    } else {
      setMessage('Failed to create room');
    }
  };

  // �[�J�ж�
  const joinRoom = async (roomId) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/study/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (response.ok) {
      setMessage('Joined room successfully');
      fetchCurrentRoom(); // ��s�ϥΪ̷�e�[�J���ж�
      fetchAllRooms(); // ��s�������ж��C��
    } else {
      setMessage(data.message || 'Failed to join room');
    }
  };

  // �b�ե�[��������������ж��C��M�ϥΪ̷�e�[�J���ж�
  useEffect(() => {
    fetchAllRooms();
    fetchCurrentRoom();
  }, []);

  return (
    <div>
      <h2>�۲߫�</h2>
      <div>
        <h3>�Ыئ۲߫�</h3>
        <input
          type="text"
          placeholder="��J�W��"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button onClick={createRoom}>�Ыئ۲߫�</button>
      </div>
      <div>
        <h3>�۲߫ǦC��</h3>
        <ul>
          {allRooms.map((room) => (
            <li key={room.id}>
              {room.name} (�ХD: {room.creator_name})
              {!currentRoom && ( // �p�G�ϥΪ̨S���[�J����ж��A��ܥ[�J���s
                <button onClick={() => joinRoom(room.id)}>�[�J</button>
              )}
            </li>
          ))}
        </ul>
      </div>
      {currentRoom && (
        <div>
          <h3>�A�ثe���ж�</h3>
          <p>
            �A�ثe�b: <strong>{currentRoom.name}</strong> (�ХD: {currentRoom.creator_name})
          </p>
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}

export default RoomsPage;