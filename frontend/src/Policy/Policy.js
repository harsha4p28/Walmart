import "./Policy.css";

export default function Policy() {
  return (
    <div className="page-container">
      <div className="policy-page">
        <h2>Privacy & Terms of Use</h2>

        <section>
          <h3>🔒 Privacy Policy</h3>
          <p>
            This AI Simulation Dashboard is a student project developed for the Walmart Sparkathon 2025.
            We collect only basic form input (like your name, email, and shipping data) to simulate logistics and emissions.
          </p>
          <p>
            We do not share, sell, or misuse your personal data. No cookies, trackers, or third-party analytics are used in this app.
            Any data collected during simulations is deleted periodically or stored securely on local servers for demonstration purposes only.
          </p>
        </section>

        <section>
          <h3>📜 Terms of Use</h3>
          <p>
            By using this application, you agree to use it only for educational or non-commercial simulation purposes. The results generated (distance, emissions, route suggestions) are approximations and not meant for real-world logistics decisions.
          </p>
          <p>
            This project is <strong>not affiliated with or endorsed by Walmart Inc.</strong> and is intended solely for academic presentation.
          </p>
        </section>

        <section>
          <h3>🧁 Cookie Policy</h3>
          <p>
            This app does not use cookies or any tracking scripts. Your experience remains local and privacy-focused.
          </p>
        </section>

        <section>
          <h3>📅 Last Updated:</h3>
          <p>July 5, 2025</p>
        </section>

        
      </div>
    </div>
  );
}
