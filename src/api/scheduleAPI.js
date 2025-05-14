// scheduleAPI.js
import axios from 'axios';

const API_BASE = `${process.env.REACT_APP_API_URL}/api/schedule`;

export const fetchScheduleByDate = (date, token) =>
  axios.get(API_BASE, {
    headers: { Authorization: `Bearer ${token}` },
    params: { date }
  });

export const addSchedule = (data, token) =>
  axios.post(API_BASE, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const updateSchedule = (id, data, token) =>
  axios.put(`${API_BASE}/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });

export const deleteSchedule = (id, token) =>
  axios.delete(`${API_BASE}/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
