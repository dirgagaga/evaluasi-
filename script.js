document.addEventListener('DOMContentLoaded', () => {

    // Fungsi helper untuk LocalStorage
    const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
    const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));

    const currentPage = window.location.pathname.split('/').pop();

    // Blok untuk halaman register.html
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

    // Blok untuk halaman index.html
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

    // Blok untuk halaman lobby.html
    if (currentPage === 'lobby.html') {
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

        // LOGIKA UNTUK UPLOAD KE BACKBLAZE
        evaluasiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const hari = document.getElementById('hari').value;
            const deskripsi = document.getElementById('deskripsi').value;
            const fotoFiles = Array.from(fotoInput.files);

            if (fotoFiles.length === 0) {
                alert('Harap unggah minimal satu foto bukti.');
                return;
            }
            
            alert('Mengunggah file ke cloud... Mohon tunggu.');

            try {
                const uploadPromises = fotoFiles.map(async (file) => {
                    const response = await fetch(`/api/generate-upload-url?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
                    const { uploadUrl, fileKey } = await response.json();

                    await fetch(uploadUrl, {
                        method: 'PUT',
                        body: file,
                        headers: { 'Content-Type': file.type },
                    });
                    
                    return fileKey;
                });

                const uploadedFileKeys = await Promise.all(uploadPromises);

                const evaluasiData = getData('evaluasi');
                const newEvaluasi = {
                    id: Date.now(),
                    user: loggedInUser,
                    hari,
                    deskripsi,
                    foto: uploadedFileKeys, // Simpan array path file
                    tanggal: new Date().toISOString()
                };
                evaluasiData.push(newEvaluasi);
                setData('evaluasi', evaluasiData);

                alert('Evaluasi berhasil disimpan dan file diunggah ke cloud!');
                evaluasiForm.reset();
                tampilkanRiwayat();

            } catch (error) {
                console.error("Error selama proses unggah:", error);
                alert("Terjadi kesalahan saat mengunggah gambar ke cloud.");
            }
        });
        
        // FUNGSI UNTUK MENAMPILKAN RIWAYAT DARI BACKBLAZE
        const tampilkanRiwayat = async () => {
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
                
                for (const item of groupedByWeek[week]) {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'history-item';
                    
                    const imageUrlPromises = item.foto.map(fileKey =>
                        fetch(`/api/get-download-url?fileKey=${encodeURIComponent(fileKey)}`)
                            .then(res => res.json())
                            .then(data => data.downloadUrl)
                            .catch(() => null)
                    );
                    
                    const downloadUrls = await Promise.all(imageUrlPromises);
                    
                    let imagesHTML = '<div class="history-images-container">';
                    downloadUrls.forEach((url, index) => {
                        if (url) {
                            imagesHTML += `
                                <div class="history-image-wrapper">
                                    <img src="${url}" alt="Bukti ${index + 1}" class="history-image">
                                    <a href="${url}" target="_blank" class="download-link">Lihat/Unduh</a>
                                </div>
                            `;
                        }
                    });
                    imagesHTML += '</div>';
                    
                    const tanggalSpesifik = new Date(item.tanggal).toLocaleDateString('id-ID', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                    });

                    itemDiv.innerHTML = `
                        <div class="history-item-content">
                            <h4>${item.hari} - ${tanggalSpesifik}</h4>
                            <p>${item.deskripsi}</p>
                            ${imagesHTML}
                        </div>
                    `;
                    weekGroupDiv.appendChild(itemDiv);
                }
                riwayatContainer.appendChild(weekGroupDiv);
            }
        };

        // P
