document.addEventListener('DOMContentLoaded', () => {

    // --- FUNGSI PEMBANTU ---
    const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    const currentPage = window.location.pathname.split('/').pop();

    // --- LOGIKA UNTUK HALAMAN REGISTER ---
    if (currentPage === 'register.html') {
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('reg-username').value;
                const password = document.getElementById('reg-password').value;
                const users = getData('users');
                const userExists = users.find(user => user.username === username);

                if (userExists) {
                    alert('Username sudah terdaftar!');
                } else {
                    users.push({ username, password });
                    setData('users', users);
                    alert('Pendaftaran berhasil! Silakan login.');
                    window.location.href = 'index.html';
                }
            });
        }
    }

    // --- LOGIKA UNTUK HALAMAN LOGIN ---
    if (currentPage === 'index.html' || currentPage === '') {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                const users = getData('users');
                const user = users.find(u => u.username === username && u.password === password);

                if (user) {
                    sessionStorage.setItem('loggedInUser', username);
                    window.location.href = 'lobby.html';
                } else {
                    alert('Username atau password salah!');
                }
            });
        }
    }

    // --- LOGIKA UNTUK HALAMAN LOBBY ---
    if (currentPage === 'lobby.html') {
        // Cek apakah pengguna sudah login
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            window.location.href = 'index.html';
            return;
        }

        // Tampilkan info profil dan siapkan tombol logout
        document.getElementById('profile-name').textContent = `Selamat datang, ${loggedInUser}`;
        document.getElementById('logout-btn').addEventListener('click', () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });

        const evaluasiForm = document.getElementById('evaluasi-form');
        const fotoInput = document.getElementById('foto');
        const submitButton = evaluasiForm.querySelector('button[type="submit"]');

        // Fungsi untuk menampilkan riwayat dari Backblaze
        const tampilkanRiwayat = async () => {
            const riwayatContainer = document.getElementById('riwayat-container');
            riwayatContainer.innerHTML = 'Memuat riwayat...';
            const evaluasiData = getData('evaluasi').filter(item => item.user === loggedInUser);

            if (evaluasiData.length === 0) {
                riwayatContainer.innerHTML = '<p>Belum ada riwayat evaluasi.</p>';
                return;
            }

            riwayatContainer.innerHTML = '';

            const getWeekNumber = (d) => {
                d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                return [d.getUTCFullYear(), weekNo];
            };
