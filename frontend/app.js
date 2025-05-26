const API_URL = 'http://localhost:8000';

// Utility functions
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('sr-RS', {
        style: 'currency',
        currency: 'BAM'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('sr-RS');
}

// User Type Toggle
document.querySelectorAll('input[name="userType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const isIndividual = e.target.value === 'individual';
        document.getElementById('individualFields').style.display = isIndividual ? 'block' : 'none';
        document.getElementById('companyFields').style.display = isIndividual ? 'none' : 'block';
        
        // Update required fields
        const individualInputs = document.querySelectorAll('#individualFields input');
        const companyInputs = document.querySelectorAll('#companyFields input');
        
        individualInputs.forEach(input => {
            input.required = isIndividual;
        });
        
        companyInputs.forEach(input => {
            input.required = !isIndividual;
        });
    });
});

// Combined User Form
document.getElementById('userForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const isIndividual = document.getElementById('individualType').checked;
    const endpoint = isIndividual ? '/users/individual' : '/users/company';
    
    const formData = {
        phone_number: document.getElementById('phone').value,
        initial_balance: parseFloat(document.getElementById('initialBalance').value),
        city: document.getElementById('city').value
    };

    if (isIndividual) {
        Object.assign(formData, {
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            personal_id: document.getElementById('personalId').value,
            jmbg: document.getElementById('jmbg').value
        });
    } else {
        Object.assign(formData, {
            company_number: document.getElementById('companyNumber').value,
            representative_first_name: document.getElementById('repFirstName').value,
            representative_last_name: document.getElementById('repLastName').value
        });
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Greška pri kreiranju korisnika');
        }

        const user = await response.json();
        alert(`Korisnik uspješno kreiran!\nBroj računa: ${user.account_number}`);
        e.target.reset();
        loadUsers();
    } catch (error) {
        alert(error.message);
    }
});

// Transaction Form
let selectedPayer = null;
let selectedRecipient = null;

document.getElementById('payer').addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query.length < 2) return;

    try {
        const response = await fetch(`${API_URL}/users/search/${query}`);
        const users = await response.json();
        
        const resultsDiv = document.getElementById('payerResults');
        resultsDiv.innerHTML = '';
        resultsDiv.classList.add('active');

        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.textContent = `${user.first_name || user.representative_first_name} ${user.last_name || user.representative_last_name} - ${user.account_number}`;
            div.onclick = () => {
                selectedPayer = user;
                document.getElementById('payer').value = `${user.first_name || user.representative_first_name} ${user.last_name || user.representative_last_name}`;
                resultsDiv.classList.remove('active');
            };
            resultsDiv.appendChild(div);
        });
    } catch (error) {
        console.error('Error searching users:', error);
    }
});

document.getElementById('recipient').addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query.length < 2) return;

    try {
        const response = await fetch(`${API_URL}/users/search/${query}`);
        const users = await response.json();
        
        const resultsDiv = document.getElementById('recipientResults');
        resultsDiv.innerHTML = '';
        resultsDiv.classList.add('active');

        users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.textContent = `${user.first_name || user.representative_first_name} ${user.last_name || user.representative_last_name} - ${user.account_number}`;
            div.onclick = () => {
                selectedRecipient = user;
                document.getElementById('recipient').value = `${user.first_name || user.representative_first_name} ${user.last_name || user.representative_last_name}`;
                resultsDiv.classList.remove('active');
            };
            resultsDiv.appendChild(div);
        });
    } catch (error) {
        console.error('Error searching users:', error);
    }
});

document.getElementById('transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedPayer || !selectedRecipient) {
        alert('Molimo odaberite i platitelja i primaoca');
        return;
    }

    const formData = {
        payer_id: selectedPayer.id,
        recipient_id: selectedRecipient.id,
        amount: parseFloat(document.getElementById('amount').value),
        payment_reference: document.getElementById('paymentReference').value,
        city: document.getElementById('transactionCity').value,
        payment_purpose: document.getElementById('paymentPurpose').value
    };

    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Greška pri izvršavanju prenosa');
        }

        alert('Prenos uspješno izvršen!');
        e.target.reset();
        selectedPayer = null;
        selectedRecipient = null;
        loadUsers();
    } catch (error) {
        alert(error.message);
    }
});

// Load users
async function loadUsers() {
    try {
        const response = await fetch('http://localhost:8000/users');
        const users = await response.json();
        const usersList = document.getElementById('usersList');
        usersList.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.user_type === 'individual' ? 'Individualni' : 'Firma'}</td>
                <td>${user.user_type === 'individual' ? 
                    `${user.first_name} ${user.last_name}` : 
                    `${user.representative_first_name} ${user.representative_last_name} (${user.company_number})`}</td>
                <td>${user.account_number}</td>
                <td>${user.phone_number}</td>
                <td>${user.city}</td>
                <td>${formatCurrency(user.current_balance)}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="showTransactionHistory(${user.id})">
                        Istorija
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteUser(${user.id})">
                        Obriši
                    </button>
                </td>
            `;
            usersList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading users:', error);
        alert('Greška pri učitavanju korisnika');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Da li ste sigurni da želite obrisati ovog korisnika?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            alert('Korisnik uspješno obrisan');
            loadUsers();
        } else {
            const error = await response.json();
            alert(`Greška pri brisanju korisnika: ${error.detail}`);
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Greška pri brisanju korisnika');
    }
}

// Add input validation
document.addEventListener('DOMContentLoaded', function() {
    // Phone number validation
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    });

    // Number-only inputs
    const numberInputs = document.querySelectorAll('input[pattern="[0-9]+"]');
    numberInputs.forEach(input => {
        input.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    });

    // Initial balance validation
    const balanceInput = document.getElementById('initialBalance');
    if (balanceInput) {
        balanceInput.addEventListener('input', function(e) {
            if (this.value < 0) {
                this.value = 0;
            }
        });
    }

    // Amount validation
    const amountInput = document.getElementById('amount');
    if (amountInput) {
        amountInput.addEventListener('input', function(e) {
            if (this.value < 0) {
                this.value = 0;
            }
        });
    }
});

async function showTransactionHistory(userId) {
    try {
        const response = await fetch(`${API_URL}/transactions/user/${userId}`);
        const transactions = await response.json();
        
        const tbody = document.getElementById('transactionHistoryBody');
        tbody.innerHTML = '';

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Nema transakcija</td></tr>';
        } else {
            transactions.forEach(transaction => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${formatDate(transaction.date)}</td>
                    <td>${transaction.payer.first_name || transaction.payer.representative_first_name} ${transaction.payer.last_name || transaction.payer.representative_last_name} (${transaction.payer.account_number})</td>
                    <td>${transaction.recipient.first_name || transaction.recipient.representative_first_name} ${transaction.recipient.last_name || transaction.recipient.representative_last_name} (${transaction.recipient.account_number})</td>
                    <td>${formatCurrency(transaction.amount)}</td>
                    <td>${transaction.payment_purpose}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        const modal = new bootstrap.Modal(document.getElementById('transactionHistoryModal'));
        modal.show();
    } catch (error) {
        console.error('Error loading transaction history:', error);
        alert('Greška pri učitavanju istorije transakcija');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadUsers();
}); 