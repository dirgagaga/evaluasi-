document.addEventListener('DOMContentLoaded', () => {

    // Fungsi untuk mendapatkan data dari LocalStorage
    const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
    // Fungsi untuk menyimpan data ke LocalStorage
    const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    // Cek di halaman mana kita berada
    const currentPage = window.location.pathname.split('/').pop();

    if (currentPage === 'register.html' || currentPage === '') {
        const registerForm = document.getElementById('register-form');
        if(registerForm) {
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

    if (currentPage === 'index.html' || currentPage === '') {
        const loginForm = document.getElementById('login-form');
        if(loginForm) {
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

    if (currentPage === 'lobby.html') {
        document.body.classList.add('lobby'); 

        const loggedInUser = sessionStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('profile-name').textContent = `Selamat datang, ${loggedInUser}`;
        document.getElementById('logout-btn').addEventListener('click', () => {
            sessionStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });

        const evaluasiForm = document.getElementById('evaluasi-form');
        const fotoInput = document.getElementById('foto');
        const previewContainer = document.getElementById('preview-container');

        // PERUBAHAN: Tampilkan preview untuk banyak gambar
        fotoInput.addEventListener('change', () => {
            previewContainer.innerHTML = ''; // Kosongkan preview lama
            if (fotoInput.files.length > 0) {
                for (const file of fotoInput.files) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.classList.add('preview-image');
                        previewContainer.appendChild(img);
                    }
                    reader.readAsDataURL(file);
                }
            }
        });

        // PERUBAHAN: Simpan data evaluasi dengan banyak gambar
        evaluasiForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const hari = document.getElementById('hari').value;
            const deskripsi = document.getElementById('deskripsi').value;
            const fotoFiles = fotoInput.files;

            if (fotoFiles.length === 0) {
                alert('Harap unggah minimal satu foto bukti.');
                return;
            }

            // Fungsi untuk membaca satu file sebagai Base64
            const readFileAsBase64 = (file) => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (error) => reject(error);
                    reader.readAsDataURL(file);
                });
            };

            // Baca semua file yang dipilih secara bersamaan
            Promise.all(Array.from(fotoFiles).map(file => readFileAsBase64(file)))
                .then(imagesBase64 => {
                    const evaluasiData = getData('evaluasi');
                    const newEvaluasi = {
                        id: Date.now(),
                        user: loggedInUser,
                        hari,
                        deskripsi,
                        foto: imagesBase64, // Simpan sebagai array of Base64 strings
                        tanggal: new Date().toISOString()
                    };

                    evaluasiData.push(newEvaluasi);
                    setData('evaluasi', evaluasiData);

                    alert('Evaluasi berhasil disimpan!');
                    evaluasiForm.reset();
                    previewContainer.innerHTML = '';
                    tampilkanRiwayat();
                })
                .catch(error => {
                    console.error("Gagal membaca file:", error);
                    alert("Terjadi kesalahan saat mengunggah gambar.");
                });
        });

        const tampilkanRiwayat = () => {
            const riwayatContainer = document.getElementById('riwayat-container');
            riwayatContainer.innerHTML = '';
            const evaluasiData = getData('evaluasi').filter(item => item.user === loggedInUser);

            if (evaluasiData.length === 0) {
                riwayatContainer.innerHTML = '<p>Belum ada riwayat evaluasi.</p>';
                return;
            }
            
            const getWeekNumber = (d) => {
                d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
                d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
                var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
                var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
                return [d.getUTCFullYear(), weekNo];
            };

            const groupedByWeek = evaluasiData.reduce((acc, curr) => {
                const [year, week] = getWeekNumber(new Date(curr.tanggal));
                const key = `Minggu ${week}, ${year}`;
                if (!acc[key]) {
                    acc[key] = [];
                }
                acc[key].push(curr);
                return acc;
            }, {});
            
            for (const week in groupedByWeek) {
                const weekGroupDiv = document.createElement('div');
                weekGroupDiv.className = 'week-group';
                
                const weekTitle = document.createElement('h3');
                weekTitle.textContent = week;
                weekGroupDiv.appendChild(weekTitle);
                
                const dayOrder = { 'Senin': 1, 'Selasa': 2, 'Rabu': 3, 'Kamis': 4, 'Jumat': 5 };
                groupedByWeek[week].sort((a, b) => dayOrder[a.hari] - dayOrder[b.hari]);

                groupedByWeek[week].forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'history-item';

                    // PERUBAHAN: Buat galeri gambar dan link download
                    let imagesHTML = '<div class="history-images-container">';
                    item.foto.forEach((fotoSrc, index) => {
                        imagesHTML += `
                            <div class="history-image-wrapper">
                                <img src="${fotoSrc}" alt="Bukti ${index + 1}" class="history-image">
                                <a href="${fotoSrc}" download="bukti_${item.hari}_${index + 1}.png" class="download-link">Unduh Gambar</a>
                            </div>
                        `;
                    });
                    imagesHTML += '</div>';

                    // PERUBAHAN: Format tanggal yang lebih spesifik
                    const tanggalSpesifik = new Date(item.tanggal).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    itemDiv.innerHTML = `
                        <div class="history-item-content">
                            <h4>${item.hari} - ${tanggalSpesifik}</h4>
                            <p>${item.deskripsi}</p>
                            ${imagesHTML}
                        </div>
                    `;
                    weekGroupDiv.appendChild(itemDiv);
                });
                riwayatContainer.appendChild(weekGroupDiv);
            }
        };

        tampilkanRiwayat();
    }
});
