// Test recycle bin function
console.log('🔧 Test script loaded');

function testRecycleBin() {
    console.log('🔧 Testing recycle bin...');
    
    // Show recycle bin module
    const recycleBinModule = document.getElementById('recycleBin');
    if (recycleBinModule) {
        console.log('✅ Found recycleBin module');
        
        // Hide all modules
        document.querySelectorAll('.module-content').forEach(module => {
            module.classList.add('d-none');
        });
        
        // Show recycle bin
        recycleBinModule.classList.remove('d-none');
        
        // Try to call loadRecycleBin directly
        if (typeof loadRecycleBin === 'function') {
            console.log('✅ Found loadRecycleBin function, calling it...');
            loadRecycleBin();
        } else {
            console.log('❌ loadRecycleBin function not found');
            
            // Manual call to API
            fetch('/api/recycle-bin')
                .then(response => response.json())
                .then(data => {
                    console.log('📦 Recycle bin data:', data);
                    
                    const tableBody = document.getElementById('recycleBinTableBody');
                    const emptyState = document.getElementById('recycleBinEmptyState');
                    
                    if (data && data.length > 0) {
                        console.log('✅ Found data, updating table...');
                        tableBody.innerHTML = data.map(item => `
                            <tr>
                                <td>${item.TypeName}</td>
                                <td>${item.RecordTitle}</td>
                                <td>${item.DeletedBy}</td>
                                <td>${new Date(item.DeletedDate).toLocaleString('vi-VN')}</td>
                                <td>
                                    <button class="btn btn-success btn-sm">Khôi phục</button>
                                    <button class="btn btn-danger btn-sm">Xóa vĩnh viễn</button>
                                </td>
                            </tr>
                        `).join('');
                        emptyState.classList.add('d-none');
                    } else {
                        console.log('📭 No data found');
                        tableBody.innerHTML = '';
                        emptyState.classList.remove('d-none');
                    }
                })
                .catch(error => {
                    console.error('❌ API Error:', error);
                });
        }
    } else {
        console.log('❌ recycleBin module not found');
    }
}

// Make function available globally
window.testRecycleBin = testRecycleBin;
