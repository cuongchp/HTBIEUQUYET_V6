// Draft Management Module
// Functions: loadDraftManagement, viewDraftDetails, createDraft, editDraft, deleteDraft, displayDrafts

// Global variable to store current editing draft ID
let currentEditingDraftId = null;

async function loadDraftManagement() {
    try {
        const response = await fetch('/api/drafts');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const drafts = await response.json();
        displayDrafts(drafts);
    } catch (error) {
        console.error('Error loading drafts:', error);
        showNotification('Lỗi khi tải danh sách dự thảo', 'error');
    }
}

function displayDrafts(drafts) {
    // Try multiple possible table IDs for flexibility
    const possibleTableIds = ['draftsTableBody', 'activeDraftsTableBody', 'allDraftsTableBody'];
    let tableBody = null;
    
    for (const id of possibleTableIds) {
        tableBody = document.getElementById(id);
        if (tableBody) break;
    }
    
    if (!tableBody) {
        console.warn('Không tìm thấy bảng dự thảo để hiển thị');
        return;
    }
    
    tableBody.innerHTML = '';
    
    if (!drafts || drafts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">Không có dự thảo nào</td></tr>';
        return;
    }
    
    drafts.forEach((draft, index) => {
        const row = document.createElement('tr');
        const createdDate = new Date(draft.CreatedDate).toLocaleDateString('vi-VN');
        const statusBadge = getStatusBadge(draft.Status);
        
        // Determine the number of columns based on table structure
        const isAdminTable = tableBody.id === 'allDraftsTableBody';
        
        if (isAdminTable) {
            // Admin table with all columns including edit/delete buttons
            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>
                    <div>
                        <strong>${escapeHtml(draft.Title)}</strong>
                        ${draft.Content ? `<br><small class="text-muted">${escapeHtml(draft.Content.substring(0, 100))}${draft.Content.length > 100 ? '...' : ''}</small>` : ''}
                    </div>
                </td>
                <td class="text-center">${statusBadge}</td>
                <td class="text-center d-none d-md-table-cell">
                    <small>${escapeHtml(draft.CreatedBy || 'N/A')}</small>
                </td>
                <td class="text-center d-none d-lg-table-cell">
                    <small>${createdDate}</small>
                </td>
                <td class="text-center">
                    <span class="badge bg-info">${draft.CommentCount || 0}</span>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="viewDraftDetails(${draft.DraftID})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-warning btn-sm" onclick="editDraft(${draft.DraftID})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="confirmDeleteDraft(${draft.DraftID}, '${escapeHtml(draft.Title)}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
        } else {
            // Regular table - need to match the existing structure with action buttons
            row.innerHTML = `
                <td class="text-center d-none d-md-table-cell">${index + 1}</td>
                <td>
                    <div>
                        <strong>${escapeHtml(draft.Title)}</strong>
                        <br><small class="text-muted">Tạo bởi: ${escapeHtml(draft.CreatedBy || 'N/A')}</small>
                    </div>
                </td>
                <td class="text-center d-none d-lg-table-cell">
                    <small>${createdDate}</small>
                </td>
                <td class="text-center d-none d-lg-table-cell">
                    <small>${draft.CommentPeriod || 7} ngày</small>
                </td>
                <td class="text-center">
                    <div class="btn-group btn-group-sm" role="group">
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="viewDraftDetails(${draft.DraftID})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-outline-warning btn-sm" onclick="editDraft(${draft.DraftID})" title="Chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="confirmDeleteDraft(${draft.DraftID}, '${escapeHtml(draft.Title)}')" title="Xóa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
        }
        
        // Store draft data for filtering
        row.dataset.title = (draft.Title || '').toLowerCase();
        row.dataset.status = draft.Status || '';
        row.dataset.creator = String(draft.CreatedBy || '').toLowerCase();
        
        tableBody.appendChild(row);
    });
}

function getStatusBadge(status) {
    switch (status) {
        case 'Draft':
            return '<span class="badge bg-secondary">Dự thảo</span>';
        case 'Review':
            return '<span class="badge bg-warning">Đang xem xét</span>';
        case 'Approved':
            return '<span class="badge bg-success">Đã duyệt</span>';
        case 'Rejected':
            return '<span class="badge bg-danger">Từ chối</span>';
        default:
            return '<span class="badge bg-light text-dark">Không xác định</span>';
    }
}

async function createDraft(title, content, commentPeriod = 7, files = null, viewerType = 'all', selectedUserIds = []) {
    try {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        formData.append('commentPeriod', commentPeriod);
        formData.append('viewerType', viewerType);
        
        // Add selected user IDs for specific permissions
        if (viewerType === 'specific' && selectedUserIds.length > 0) {
            formData.append('selectedUserIds', JSON.stringify(selectedUserIds));
        }
        
        console.log('📤 Sending draft data:', { title, viewerType, selectedUserIds });
        
        // Add files if provided
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
        }
        
        const response = await fetch('/api/drafts', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification('Tạo dự thảo thành công!', 'success');
            loadDraftManagement(); // Reload the list
            return true;
        } else {
            throw new Error(result.error || 'Có lỗi xảy ra');
        }
    } catch (error) {
        console.error('Error creating draft:', error);
        showNotification('Lỗi tạo dự thảo: ' + error.message, 'error');
        return false;
    }
}

// View draft details
async function viewDraftDetails(draftId) {
    try {
        const response = await fetch(`/api/drafts/${draftId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success && result.draft) {
            showDraftDetailsModal(result.draft, result.comments || []);
        } else {
            throw new Error(result.error || 'Không thể tải chi tiết dự thảo');
        }
    } catch (error) {
        console.error('Error loading draft details:', error);
        showNotification('Lỗi khi tải chi tiết dự thảo: ' + error.message, 'error');
    }
}

// Edit draft
async function editDraft(draftId) {
    try {
        const response = await fetch(`/api/drafts/${draftId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        if (result.success && result.draft) {
            currentEditingDraftId = draftId;
            showEditDraftModal(result.draft);
        } else {
            throw new Error(result.error || 'Không thể tải dữ liệu dự thảo để chỉnh sửa');
        }
    } catch (error) {
        console.error('Error loading draft for editing:', error);
        showNotification('Lỗi khi tải dự thảo để chỉnh sửa: ' + error.message, 'error');
    }
}

// Update draft
async function updateDraft(draftId, title, content, status = null, files = null) {
    try {
        console.log('🔄 Starting draft update:', { draftId, title, status });
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        
        if (status) {
            formData.append('status', status);
        }
        
        // Add files if provided
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }
        }
        
        const response = await fetch(`/api/drafts/${draftId}`, {
            method: 'PUT',
            body: formData
        });
        
        const result = await response.json();
        console.log('📝 Update response:', { status: response.status, result });
        
        if (response.ok && result.success) {
            console.log('✅ Draft updated successfully, refreshing lists...');
            showNotification('Cập nhật dự thảo thành công!', 'success');
            currentEditingDraftId = null;
            
            // Reload appropriate list based on current context
            if (typeof loadActiveDrafts === 'function') {
                console.log('🔄 Reloading active drafts...');
                loadActiveDrafts();
            }
            if (typeof loadAllDraftsForAdmin === 'function') {
                console.log('🔄 Reloading admin drafts...');
                loadAllDraftsForAdmin();
            }
            
            return true;
        } else {
            throw new Error(result.error || 'Có lỗi xảy ra khi cập nhật');
        }
    } catch (error) {
        console.error('❌ Error updating draft:', error);
        showNotification('Lỗi cập nhật dự thảo: ' + error.message, 'error');
        return false;
    }
}

// Confirm delete draft
function confirmDeleteDraft(draftId, draftTitle) {
    if (confirm(`Bạn có chắc chắn muốn xóa dự thảo "${draftTitle}"?\n\nDự thảo sẽ được chuyển vào thùng rác và có thể khôi phục sau.`)) {
        deleteDraft(draftId);
    }
}

// Delete draft
async function deleteDraft(draftId) {
    try {
        const response = await fetch(`/api/drafts/${draftId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showNotification('Dự thảo đã được chuyển vào thùng rác!', 'success');
            
            // Reload appropriate list based on current context
            if (typeof loadActiveDrafts === 'function') {
                loadActiveDrafts();
            }
            if (typeof loadAllDraftsForAdmin === 'function') {
                loadAllDraftsForAdmin();
            }
            
            return true;
        } else {
            throw new Error(result.error || 'Có lỗi xảy ra khi xóa');
        }
    } catch (error) {
        console.error('Error deleting draft:', error);
        showNotification('Lỗi xóa dự thảo: ' + error.message, 'error');
        return false;
    }
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
        return 'N/A';
    }
}

// Show notification (simple implementation)
function showNotification(message, type = 'info') {
    // Simple console logging and temporary DOM notification
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        z-index: 9999;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        font-weight: 500;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    toast.innerHTML = `${icon} ${message}`;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// Show draft details modal
function showDraftDetailsModal(draft, comments) {
    const modalHtml = `
        <div class="modal fade" id="draftDetailsModal" tabindex="-1" aria-labelledby="draftDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="draftDetailsModalLabel">Chi tiết dự thảo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-8">
                                <h6><strong>Tiêu đề:</strong></h6>
                                <p>${escapeHtml(draft.Title)}</p>
                                
                                <h6><strong>Nội dung:</strong></h6>
                                <div class="border p-3 mb-3" style="max-height: 300px; overflow-y: auto;">
                                    ${draft.Content ? draft.Content.replace(/\n/g, '<br>') : 'Không có nội dung'}
                                </div>
                            </div>
                            <div class="col-md-4">
                                <h6><strong>Thông tin:</strong></h6>
                                <p><strong>Trạng thái:</strong> ${getStatusBadge(draft.Status)}</p>
                                <p><strong>Người tạo:</strong> ${escapeHtml(draft.CreatedBy || 'N/A')}</p>
                                <p><strong>Ngày tạo:</strong> ${formatDate(draft.CreatedDate)}</p>
                                <p><strong>Thời gian góp ý:</strong> ${draft.CommentPeriod || 7} ngày</p>
                                
                                ${draft.AttachedFiles && draft.AttachedFiles.length > 0 ? `
                                    <h6><strong>File đính kèm:</strong></h6>
                                    <ul class="list-unstyled">
                                        ${draft.AttachedFiles.map(file => 
                                            `<li><a href="${file.DownloadUrl}" target="_blank" class="text-decoration-none">
                                                <i class="fas fa-file"></i> ${escapeHtml(file.FileName)}
                                            </a></li>`
                                        ).join('')}
                                    </ul>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${comments && comments.length > 0 ? `
                            <hr>
                            <h6><strong>Góp ý (${comments.length}):</strong></h6>
                            <div style="max-height: 200px; overflow-y: auto;">
                                ${comments.map(comment => `
                                    <div class="border-bottom pb-2 mb-2">
                                        <small class="text-muted">
                                            <strong>${escapeHtml(comment.CommenterName || 'Ẩn danh')}</strong> - 
                                            ${formatDate(comment.CommentDate)}
                                        </small>
                                        <p class="mb-0">${comment.Comment ? comment.Comment.replace(/\n/g, '<br>') : ''}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p class="text-muted">Chưa có góp ý nào.</p>'}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>
                        <button type="button" class="btn btn-warning" onclick="editDraft(${draft.DraftID})">
                            <i class="fas fa-edit"></i> Chỉnh sửa
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('draftDetailsModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('draftDetailsModal'));
    modal.show();
}

// Show edit draft modal
function showEditDraftModal(draft) {
    const modalHtml = `
        <div class="modal fade" id="editDraftModal" tabindex="-1" aria-labelledby="editDraftModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="editDraftModalLabel">Chỉnh sửa dự thảo</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <form id="editDraftForm" onsubmit="handleEditDraftSubmit(event)">
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="editDraftTitle" class="form-label">Tiêu đề <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="editDraftTitle" value="${escapeHtml(draft.Title)}" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="editDraftContent" class="form-label">Nội dung <span class="text-danger">*</span></label>
                                <textarea class="form-control" id="editDraftContent" rows="8" required>${escapeHtml(draft.Content || '')}</textarea>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <label for="editDraftStatus" class="form-label">Trạng thái</label>
                                    <select class="form-select" id="editDraftStatus">
                                        <option value="Draft" ${draft.Status === 'Draft' ? 'selected' : ''}>Dự thảo</option>
                                        <option value="Review" ${draft.Status === 'Review' ? 'selected' : ''}>Đang xem xét</option>
                                        <option value="Approved" ${draft.Status === 'Approved' ? 'selected' : ''}>Đã duyệt</option>
                                        <option value="Rejected" ${draft.Status === 'Rejected' ? 'selected' : ''}>Từ chối</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label for="editDraftFiles" class="form-label">File đính kèm mới (tùy chọn)</label>
                                    <input type="file" class="form-control" id="editDraftFiles" multiple>
                                    <small class="form-text text-muted">Chọn file mới để thay thế file cũ</small>
                                </div>
                            </div>
                            
                            ${draft.AttachedFiles && draft.AttachedFiles.length > 0 ? `
                                <div class="mt-3">
                                    <h6>File hiện tại:</h6>
                                    <ul class="list-unstyled">
                                        ${draft.AttachedFiles.map(file => 
                                            `<li><a href="${file.DownloadUrl}" target="_blank" class="text-decoration-none">
                                                <i class="fas fa-file"></i> ${escapeHtml(file.FileName)}
                                            </a></li>`
                                        ).join('')}
                                    </ul>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Lưu thay đổi
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('editDraftModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Hide details modal if showing
    const detailsModal = document.getElementById('draftDetailsModal');
    if (detailsModal) {
        const detailsModalInstance = bootstrap.Modal.getInstance(detailsModal);
        if (detailsModalInstance) {
            detailsModalInstance.hide();
        }
    }
    
    // Add modal to DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('editDraftModal'));
    modal.show();
}

// Handle edit draft form submission
async function handleEditDraftSubmit(event) {
    event.preventDefault();
    
    if (!currentEditingDraftId) {
        showNotification('Lỗi: Không xác định được dự thảo cần chỉnh sửa', 'error');
        return;
    }
    
    const title = document.getElementById('editDraftTitle').value.trim();
    const content = document.getElementById('editDraftContent').value.trim();
    const status = document.getElementById('editDraftStatus').value;
    const files = document.getElementById('editDraftFiles').files;
    
    if (!title || !content) {
        showNotification('Vui lòng điền đầy đủ tiêu đề và nội dung', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
    submitBtn.disabled = true;
    
    try {
        console.log('🚀 Submitting edit form...');
        const success = await updateDraft(currentEditingDraftId, title, content, status, files);
        
        if (success) {
            console.log('✅ Update successful, closing modal...');
            // Close modal
            const modalElement = document.getElementById('editDraftModal');
            if (modalElement) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) {
                    modal.hide();
                    console.log('🚪 Modal closed');
                } else {
                    // Fallback: create new instance and hide
                    const newModal = new bootstrap.Modal(modalElement);
                    newModal.hide();
                    console.log('🚪 Modal closed (fallback)');
                }
            }
            
            // Additional cleanup
            setTimeout(() => {
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 300);
        }
    } catch (error) {
        console.error('❌ Submit error:', error);
        showNotification('Lỗi submit: ' + error.message, 'error');
    } finally {
        // Restore button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Admin functions for draft management
async function loadAllDraftsForAdmin() {
    const loadingElement = document.getElementById('draftsLoading');
    const emptyStateElement = document.getElementById('draftsEmptyState');
    const tableBody = document.getElementById('allDraftsTableBody');
    
    // Show loading
    if (loadingElement) loadingElement.classList.remove('d-none');
    if (emptyStateElement) emptyStateElement.classList.add('d-none');
    if (tableBody) tableBody.innerHTML = '';
    
    try {
        console.log('📋 Loading all drafts for admin...');
        const response = await fetch('/api/drafts/all');
        
        console.log('📡 Response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 403) {
                throw new Error('Bạn không có quyền truy cập chức năng này');
            } else if (response.status === 401) {
                throw new Error('Vui lòng đăng nhập lại');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        const drafts = await response.json();
        console.log('📄 Loaded drafts:', drafts.length);
        
        // Hide loading
        if (loadingElement) loadingElement.classList.add('d-none');
        
        if (!drafts || drafts.length === 0) {
            if (emptyStateElement) emptyStateElement.classList.remove('d-none');
            return;
        }
        
        // Display drafts in admin table
        displayAdminDrafts(drafts);
        
        // Populate creator filter
        populateCreatorFilter(drafts);
        
    } catch (error) {
        console.error('Error loading all drafts for admin:', error);
        if (loadingElement) loadingElement.classList.add('d-none');
        showNotification('Lỗi khi tải danh sách dự thảo: ' + error.message, 'error');
    }
}

function displayAdminDrafts(drafts) {
    const tableBody = document.getElementById('allDraftsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    drafts.forEach((draft, index) => {
        const row = document.createElement('tr');
        const createdDate = new Date(draft.CreatedDate).toLocaleDateString('vi-VN');
        const statusBadge = getStatusBadge(draft.Status);
        
        row.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td>
                <div>
                    <strong>${escapeHtml(draft.Title)}</strong>
                    ${draft.Content ? `<br><small class="text-muted">${escapeHtml(draft.Content.substring(0, 100))}${draft.Content.length > 100 ? '...' : ''}</small>` : ''}
                </div>
            </td>
            <td class="text-center">${statusBadge}</td>
            <td class="text-center d-none d-md-table-cell">
                <small>${escapeHtml(draft.CreatedByName || draft.CreatedBy || 'N/A')}</small>
            </td>
            <td class="text-center d-none d-lg-table-cell">
                <small>${createdDate}</small>
            </td>
            <td class="text-center">
                <span class="badge bg-info">${draft.CommentCount || 0}</span>
            </td>
            <td class="text-center">
                <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="viewDraftDetails(${draft.DraftID})" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-warning btn-sm" onclick="editDraft(${draft.DraftID})" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm" onclick="confirmDeleteDraft(${draft.DraftID}, '${escapeHtml(draft.Title)}')" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        // Store draft data for filtering
        row.dataset.title = (draft.Title || '').toLowerCase();
        row.dataset.status = draft.Status || '';
        row.dataset.creator = String(draft.CreatedByName || draft.CreatedBy || '').toLowerCase();
        
        tableBody.appendChild(row);
    });
}

function populateCreatorFilter(drafts) {
    const creatorFilter = document.getElementById('draftCreatorFilter');
    if (!creatorFilter) return;
    
    // Get unique creators - use CreatedByName if available, fallback to CreatedBy
    const creators = [...new Set(drafts.map(draft => draft.CreatedByName || draft.CreatedBy).filter(creator => creator))];
    
    // Keep "Tất cả người tạo" option and add creators
    creatorFilter.innerHTML = '<option value="">Tất cả người tạo</option>';
    creators.forEach(creator => {
        const option = document.createElement('option');
        option.value = creator;
        option.textContent = creator;
        creatorFilter.appendChild(option);
    });
}

function filterDrafts() {
    const searchTerm = document.getElementById('draftSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('draftStatusFilter')?.value || '';
    const creatorFilter = document.getElementById('draftCreatorFilter')?.value.toLowerCase() || '';
    
    const tableBody = document.getElementById('allDraftsTableBody');
    if (!tableBody) return;
    
    const rows = tableBody.getElementsByTagName('tr');
    let visibleCount = 0;
    
    for (let row of rows) {
        const title = row.dataset.title || '';
        const status = row.dataset.status || '';
        const creator = row.dataset.creator || '';
        
        const matchesSearch = !searchTerm || title.includes(searchTerm);
        const matchesStatus = !statusFilter || status === statusFilter;
        const matchesCreator = !creatorFilter || creator.includes(creatorFilter);
        
        if (matchesSearch && matchesStatus && matchesCreator) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    }
    
    // Show/hide empty state based on visible rows
    const emptyState = document.getElementById('draftsEmptyState');
    if (emptyState) {
        if (visibleCount === 0 && rows.length > 0) {
            emptyState.classList.remove('d-none');
            emptyState.querySelector('h5').textContent = 'Không tìm thấy dự thảo nào';
            emptyState.querySelector('p').textContent = 'Thử điều chỉnh bộ lọc để xem kết quả khác';
        } else {
            emptyState.classList.add('d-none');
        }
    }
}

function clearDraftFilters() {
    const searchInput = document.getElementById('draftSearch');
    const statusFilter = document.getElementById('draftStatusFilter');
    const creatorFilter = document.getElementById('draftCreatorFilter');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (creatorFilter) creatorFilter.value = '';
    
    filterDrafts();
}

// Modal functions
function showCreateDraftModal() {
    // Show the create draft modal
    const modal = new bootstrap.Modal(document.getElementById('createDraftModal'));
    modal.show();
    
    // Reset form
    const form = document.getElementById('draftForm');
    if (form) {
        form.reset();
        // Set default values
        const commentPeriod = document.getElementById('commentPeriod');
        if (commentPeriod) commentPeriod.value = '7';
        
        const priority = document.getElementById('draftPriority');
        if (priority) priority.value = 'normal';
    }
}

// Handle create draft form submission
async function handleCreateDraftSubmit(event) {
    event.preventDefault();
    
    const title = document.getElementById('draftTitle')?.value.trim();
    const content = document.getElementById('draftContent')?.value.trim();
    const commentPeriod = document.getElementById('commentPeriod')?.value || 7;
    const files = document.getElementById('draftFiles')?.files;
    
    // Get viewer permissions data
    const viewerType = document.querySelector('input[name="viewerType"]:checked')?.value || 'all';
    let selectedUserIds = [];
    
    if (viewerType === 'specific') {
        // Get selected users from the selectedUsers div
        const selectedUserElements = document.querySelectorAll('#selectedUsers .selected-user-item[data-user-id]');
        selectedUserIds = Array.from(selectedUserElements).map(el => parseInt(el.dataset.userId));
        
        if (selectedUserIds.length === 0) {
            showNotification('Vui lòng chọn ít nhất một người dùng được xem dự thảo', 'error');
            return false;
        }
    }
    
    if (!title || !content) {
        showNotification('Vui lòng điền đầy đủ tiêu đề và nội dung', 'error');
        return false;
    }
    
    console.log('📋 Draft data:', { title, content, commentPeriod, viewerType, selectedUserIds });
    
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';
        submitBtn.disabled = true;
        
        try {
            const success = await createDraft(title, content, commentPeriod, files, viewerType, selectedUserIds);
            if (success) {
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('createDraftModal'));
                if (modal) modal.hide();
                
                // Reset form
                const form = document.getElementById('draftForm');
                if (form) form.reset();
                
                // Reset viewer selection
                resetViewerSelection();
                
                // Reload admin drafts if in admin section
                if (typeof loadAllDraftsForAdmin === 'function') {
                    loadAllDraftsForAdmin();
                }
                
                return true;
            }
        } finally {
            // Restore button state
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        }
    }
    
    return false;
}

// Reset viewer selection to default state
function resetViewerSelection() {
    // Reset radio buttons to "all users"
    const viewerAllRadio = document.getElementById('viewerAll');
    if (viewerAllRadio) {
        viewerAllRadio.checked = true;
    }
    
    // Hide specific viewers section
    const specificViewers = document.getElementById('specificViewers');
    if (specificViewers) {
        specificViewers.classList.add('d-none');
    }
    
    // Clear selected users
    const selectedUsers = document.getElementById('selectedUsers');
    if (selectedUsers) {
        selectedUsers.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-user-plus"></i> Chưa chọn người dùng nào
            </div>
        `;
    }
    
    // Clear search box
    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.value = '';
    }
}

// Export functions to global scope for use in other scripts
window.displayDrafts = displayDrafts;
window.editDraft = editDraft;
window.confirmDeleteDraft = confirmDeleteDraft;
window.viewDraftDetails = viewDraftDetails;
window.displayAdminDrafts = displayAdminDrafts;
