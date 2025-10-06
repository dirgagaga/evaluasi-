document.addEventListener('DOMContentLoaded', () => {

    // Fungsi untuk mendapatkan data dari LocalStorage
    const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
    // Fungsi untuk menyimpan data ke LocalStorage
    const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // Cek di halaman mana kita berada
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'register.html') {
        const registerForm = document.getElementById('register-form');
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

    if (currentPage === 'index.html') {
        const loginForm = document.getElementById('login-form');
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

    if (currentPage === 'lobby.html') {
        document.body.classList.add('lobby'); // Menambahkan kelas untuk styling khusus lobby

        const loggedInUser = sessionStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            window.location.href = 'index.html'; // Jika belum login, tendang ke halaman login
            return;
        }

        // Tampilkan info profil dan tombol logout
        document.getElementById('profile-name').textContent = `Selamat datang, ${loggedInUser}`;
        document.getElementById('logout-btn').addEventListener('click', () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });

        const evaluasiForm = document.getElementById('evaluasi-form');
        const fotoInput = document.getElementById('foto');
        const previewFoto = document.getElementById('preview-foto');

        // Tampilkan preview gambar saat dipilih
        fotoInput.addEventListener('change', () => {
            const file = fotoInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewFoto.src = e.target.result;
                    previewFoto.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });

        // Simpan data evaluasi
        evaluasiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const hari = document.getElementById('hari').value;
            const deskripsi = document.getElementById('deskripsi').value;
            const fotoFile = fotoInput.files[0];

            if (!fotoFile) {
                alert('Harap unggah foto bukti.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const fotoBase64 = reader.result;
                const evaluasiData = getData('evaluasi');
                const newEvaluasi = {
                    id: Date.now(),
                    user: loggedInUser,
                    hari,
                    deskripsi,
                    foto: fotoBase64,
                    tanggal: new Date().toISOString()
                };

                evaluasiData.push(newEvaluasi);
                setData('evaluasi', evaluasiData);

                alert('Evaluasi berhasil disimpan!');
                evaluasiForm.reset();
                previewFoto.style.display = 'none';
                tampilkanRiwayat(); // Perbarui tampilan riwayat
            };
            reader.readAsDataURL(fotoFile);
        });

        // Fungsi untuk menampilkan riwayat
        const tampilkanRiwayat = () => {
            const riwayatContainer = document.getElementById('riwayat-container');
            riwayatContainer.innerHTML = ''; // Kosongkan dulu
            const evaluasiData = getData('evaluasi').filter(item => item.user === loggedInUser);

            if (evaluasiData.length === 0) {
                riwayatContainer.innerHTML = '<p>Belum ada riwayat evaluasi.</p>';
                return;
            }

            // Fungsi untuk mendapatkan nomor minggu dari tanggal
            const getWeekNumber = (d) => {
                d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                return [d.getUTCFullYear(), weekNo];
            };

            // Kelompokkan data berdasarkan minggu
            const groupedByWeek = evaluasiData.reduce((acc, curr) => {
                const [year, week] = getWeekNumber(new Date(curr.tanggal));
                const key = `Minggu ${week}, ${year}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(curr);
                return acc;
            }, {});
            
            // Tampilkan setiap grup minggu
            for (const week in groupedByWeek) {
                const weekGroupDiv = document.createElement('div');
                weekGroupDiv.className = 'week-group';
                
                const weekTitle = document.createElement('h3');
                weekTitle.textContent = week;
                weekGroupDiv.appendChild(weekTitle);
                
                // Urutkan berdasarkan hari (custom order)
                const dayOrder = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5 };
                groupedByWeek[week].sort((a, b) => dayOrder[a.hari] - dayOrder[b.hari]);

                groupedByWeek[week].forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'history-item';
                    itemDiv.innerHTML = `
                        <img src="${item.foto}" alt="Foto ${item.hari}">
                        <div class="history-item-content">
                            <h4>${item.hari} - ${new Date(item.tanggal).toLocaleDateString('id-ID')}</h4>
                            <p>${item.deskripsi}</p>
                        </div>
                    `;
                    weekGroupDiv.appendChild(itemDiv);
                });
                riwayatContainer.appendChild(weekGroupDiv);
            }
        };

        // Panggil fungsi untuk menampilkan riwayat saat halaman dimuat
        tampilkanRiwayat();
    }
});
