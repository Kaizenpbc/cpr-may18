/* eslint-disable no-console */
import React, { useEffect, useState } from 'react';
import { api } from '../api/config';
import authService from '../api/authService';

const InstructorEndpointTests = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const testEndpoints = async () => {
    const testResults = {};
    
    try {
      // Test 1: Login
      console.log('Testing login...');
      const loginResponse = await authService.login('instructor', 'test123');
      testResults.login = {
        success: true,
        message: 'Login successful',
        data: loginResponse
      };

      // Test 2: Get Profile
      console.log('Testing get profile...');
      const profileResponse = await api.get('/api/instructor/profile');
      testResults.profile = {
        success: true,
        message: 'Profile retrieved successfully',
        data: profileResponse.data
      };

      // Test 3: Get Classes
      console.log('Testing get classes...');
      const classesResponse = await api.get('/api/instructor/classes');
      testResults.classes = {
        success: true,
        message: 'Classes retrieved successfully',
        data: classesResponse.data
      };

      // Test 4: Get Completed Classes
      console.log('Testing get completed classes...');
      const completedResponse = await api.get('/api/instructor/completed-classes');
      testResults.completedClasses = {
        success: true,
        message: 'Completed classes retrieved successfully',
        data: completedResponse.data
      };

      // Test 5: Get Availability
      console.log('Testing get availability...');
      const availabilityResponse = await api.get('/api/instructor/availability');
      testResults.availability = {
        success: true,
        message: 'Availability retrieved successfully',
        data: availabilityResponse.data
      };

      // Test 6: Update Availability
      console.log('Testing update availability...');
      const updateAvailabilityResponse = await api.put('/api/instructor/availability', {
        dates: ['2024-05-10', '2024-05-11']
      });
      testResults.updateAvailability = {
        success: true,
        message: 'Availability updated successfully',
        data: updateAvailabilityResponse.data
      };

      // Test 7: Delete Availability
      console.log('Testing delete availability...');
      const deleteAvailabilityResponse = await api.delete('/api/instructor/availability/2024-05-10');
      testResults.deleteAvailability = {
        success: true,
        message: 'Availability deleted successfully',
        data: deleteAvailabilityResponse.data
      };

      // Test 8: Update Attendance
      console.log('Testing update attendance...');
      const updateAttendanceResponse = await api.put('/api/instructor/students/1/attendance', {
        attended: true
      });
      testResults.updateAttendance = {
        success: true,
        message: 'Attendance updated successfully',
        data: updateAttendanceResponse.data
      };

    } catch (err) {
      console.error('Error testing endpoints:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      setResults(testResults);
    }
  };

  useEffect(() => {
    testEndpoints();
  }, []);

  if (loading) return <div>Testing endpoints...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Instructor Endpoint Tests</h1>
      {Object.entries(results).map(([endpoint, result]) => (
        <div key={endpoint} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h3>{endpoint}</h3>
          <p>Status: {result.success ? '✅ Success' : '❌ Failed'}</p>
          <p>Message: {result.message}</p>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
};

export default InstructorEndpointTests; 