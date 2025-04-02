import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar, Line, Pie, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";
import "./styles/Dashboard.css";

const Dashboard = () => {
  // Stats Count State Section (including entries)
  const [stats, setStats] = useState({
    societies: 0,
    users: 0,
    coupons: 0,
    events: 0,
    broadcasts: 0,
    flatOwners: 0,
    entries: 0,
  });
  const [adminInfo, setAdminInfo] = useState({ name: "", email: "", role: "" });
  const [loading, setLoading] = useState(true);

  // Use a default admin email if none is found (for testing)
  const adminEmail = localStorage.getItem("adminEmail") || "dec@gmail.com";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Admin Profile for stats
        const profileRes = await axios.get(
          `http://localhost:5000/api/auth/profile?email=${adminEmail}`
        );
        setAdminInfo(profileRes.data);

        // Fetch counts for stats including entry count
        const [
          societyRes,
          userRes,
          couponRes,
          eventRes,
          broadcastRes,
          flatOwnerRes,
          entryRes,
        ] = await Promise.all([
          axios.get(`http://localhost:5000/api/societies/count?email=${adminEmail}`),
          axios.get(`http://localhost:5000/api/users/count?email=${adminEmail}`),
          axios.get(`http://localhost:5000/api/coupons/count?email=${adminEmail}`),
          axios.get(`http://localhost:5000/api/events/count?email=${adminEmail}`),
          axios.get(`http://localhost:5000/api/broadcast/count?email=${adminEmail}`),
          axios.get(`http://localhost:5000/api/flats/count?email=${adminEmail}`),
          axios.get(`http://localhost:5000/api/entries/count?email=${adminEmail}`),
        ]);

        setStats({
          societies: societyRes.data.count,
          users: userRes.data.count,
          coupons: couponRes.data.count,
          events: eventRes.data.count,
          broadcasts: broadcastRes.data.count,
          flatOwners: flatOwnerRes.data.count,
          entries: entryRes.data.count,
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [adminEmail]);

  // -------- Chart Data Objects --------

  // 1. Bar Chart: Societies vs Flats
  const barData = {
    labels: ["Societies", "Flats"],
    datasets: [
      {
        label: "Count",
        data: [stats.societies, stats.flatOwners],
        backgroundColor: ["#FF6384", "#36A2EB"],
      },
    ],
  };

  // 2. Line Chart: Users vs Societies vs Flats
  const lineData = {
    labels: ["Users", "Societies", "Flats"],
    datasets: [
      {
        label: "Count",
        data: [stats.users, stats.societies, stats.flatOwners],
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  // 3. Pie Chart: Coupons vs Societies
  const pieData = {
    labels: ["Coupons", "Societies"],
    datasets: [
      {
        data: [stats.coupons, stats.societies],
        backgroundColor: ["#FF6384", "#36A2EB"],
        hoverBackgroundColor: ["#FF6384", "#36A2EB"],
      },
    ],
  };

  // 4. Doughnut Chart: Events per Society
  // We calculate the average events per society.
  const averageEvents = stats.societies > 0 ? stats.events / stats.societies : 0;
  // Assume a baseline max (e.g., 10) so that the chart always has a visible range.
  const baselineMax = 10;
  const maxValue = Math.max(baselineMax, averageEvents);
  const doughnutData = {
    labels: ["Average Events", "Remaining"],
    datasets: [
      {
        data: [averageEvents, maxValue - averageEvents],
        backgroundColor: ["#36A2EB", "#FFCE56"],
        hoverBackgroundColor: ["#36A2EB", "#FFCE56"],
      },
    ],
  };

  return (
    <div className="dashboard">
      <h2>📊 Dashboard</h2>
      {loading ? (
        <p className="loading">Loading data...</p>
      ) : (
        <>
          <div className="stats-container">
            {[
              { label: "🏢 Societies", value: stats.societies },
              { label: "👥 Users", value: stats.users },
              { label: "🎟️ Coupons", value: stats.coupons },
              { label: "📅 Events", value: stats.events },
              { label: "📢 Broadcasts", value: stats.broadcasts },
              { label: "🏠 Flat Owners", value: stats.flatOwners },
              { label: "📋 Entry Permissions", value: stats.entries },
            ].map((item, index) => (
              <div key={index} className="stat-card">
                <h3>{item.label}</h3>
                <p>{item.value}</p>
              </div>
            ))}
          </div>

          {/* ------ Charts Section ------ */}
          <div className="charts-container">
            <div className="chart-card">
              <h3>🏢 Societies vs Flats (Bar Chart)</h3>
              <Bar data={barData} />
            </div>
            <div className="chart-card">
              <h3>👥 Users vs Societies vs Flats (Line Chart)</h3>
              <Line data={lineData} />
            </div>
            <div className="chart-card">
              <h3>🎟️ Coupons vs Societies (Pie Chart)</h3>
              <Pie data={pieData} />
            </div>
            <div className="chart-card">
              <h3>📅 Events per Society (Doughnut Chart)</h3>
              <Doughnut data={doughnutData} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
