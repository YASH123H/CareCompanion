import React, { useEffect, useState } from 'react';

function Dashboard() {
  const [steps, setSteps] = useState([]);
  const [heartRate, setHeartRate] = useState([]);
  const [sleep, setSleep] = useState([]);
  const [oxygen, setOxygen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [
          stepsRes,
          hrRes,
          sleepRes,
          oxygenRes,
          stressRes
        ] = await Promise.all([
          fetch('/api/vitals/steps'),
          fetch('/api/vitals/heartrate'),
          fetch('/api/vitals/sleep'),
          fetch('/api/vitals/oxygen'),
        ]);
        const stepsData = await stepsRes.json();
        const heartRateData = await hrRes.json();
        const sleepData = await sleepRes.json();
        const oxygenData = await oxygenRes.json();
        const stressData = await stressRes.json();

        setSteps(stepsData.steps || []);
        setHeartRate(heartRateData.heartRate || []);
        setSleep(sleepData.sleep || []);
        setOxygen(oxygenData.oxygen || []);
      } catch (err) {
        setError(err.message || 'Error fetching data');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (loading) {
    return <div>Loading your health dashboard...</div>;
  }

  if (error) {
    return <div>Error loading dashboard: {error}</div>;
  }

  return (
    <div>
      <h1>Your Health Dashboard</h1>

      <section>
        <h2>Steps</h2>
        {steps.length === 0 ? <p>No step data.</p> :
          <table>
            <thead>
              <tr><th>Date</th><th>Steps</th></tr>
            </thead>
            <tbody>
              {steps.map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.date}</td>
                  <td>{entry.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </section>

      <section>
        <h2>Heart Rate</h2>
        {heartRate.length === 0 ? <p>No heart rate data.</p> :
          <table>
            <thead>
              <tr><th>Date</th><th>Avg Heart Rate</th></tr>
            </thead>
            <tbody>
              {heartRate.map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.date}</td>
                  <td>{entry.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </section>

      <section>
        <h2>Sleep</h2>
        {sleep.length === 0 ? <p>No sleep data.</p> :
          <table>
            <thead>
              <tr><th>Date</th><th>Duration (hours)</th></tr>
            </thead>
            <tbody>
              {sleep.map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.date}</td>
                  <td>{entry.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </section>

      <section>
        <h2>Oxygen</h2>
        {oxygen.length === 0 ? <p>No oxygen data.</p> :
          <table>
            <thead>
              <tr><th>Date</th><th>SpO2 (%)</th></tr>
            </thead>
            <tbody>
              {oxygen.map((entry, idx) => (
                <tr key={idx}>
                  <td>{entry.date}</td>
                  <td>{entry.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </section>
    </div>
  );
}

export default Dashboard;
