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

            const groupedByWeek = evaluasiData.reduce((acc, curr) => {
                const [year, week] = getWeekNumber(new Date(curr.tanggal));
                const key = `Minggu ${week}, ${year}`;
                if (!acc[key]) { acc[key] = []; }
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
                    downloadUrls.forEach((url) => {
                        if (url) {
                            imagesHTML += `
                                <div class="history-image-wrapper">
                                    <img src="${url}" alt="Bukti Gambar">
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

        // Logika untuk mengirim formulir ke Backblaze
        evaluasiForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const originalButtonText = submitButton.textContent;
            submitButton.disabled = true;
            submitButton.textContent = 'Mengunggah...';

            const hari = document.getElementById('hari').value;
            const deskripsi = document.getElementById('deskripsi').value;
            const fotoFiles = Array.from(fotoInput.files);

            if (fotoFiles.length === 0) {
                alert('Harap unggah minimal satu foto bukti.');
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                return;
            }

            try {
                const uploadPromises = fotoFiles.map(async (file) => {
                    const response = await fetch(`/api/generate-upload-url?fileName=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
                    if (!response.ok) throw new Error(`Gagal mendapatkan URL upload: ${response.statusText}`);
                    
                    const { uploadUrl, fileKey } = await response.json();

                    const uploadResponse = await fetch(uploadUrl, {
                        method: 'PUT',
                        body: file,
                        headers: { 'Content-Type': file.type },
                    });

                    if (!uploadResponse.ok) throw new Error(`Gagal mengunggah file: ${file.name}`);
                    
                    return fileKey;
                });

                const uploadedFileKeys = await Promise.all(uploadPromises);

                const evaluasiData = getData('evaluasi');
                const newEvaluasi = {
                    id: Date.now(),
                    user: loggedInUser,
                    hari,
                    deskripsi,
                    foto: uploadedFileKeys,
                    tanggal: new Date().toISOString()
                };
                evaluasiData.push(newEvaluasi);
                setData('evaluasi', evaluasiData);

                alert('Evaluasi berhasil disimpan dan file diunggah ke cloud!');
                evaluasiForm.reset();
                tampilkanRiwayat();

            } catch (error) {
                console.error("Error selama proses unggah:", error);
                alert(`Terjadi kesalahan: ${error.message}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        });
        
        // Panggil fungsi ini saat halaman lobby pertama kali dimuat
        tampilkanRiwayat();
    }

});
