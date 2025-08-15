// Voting Management Module
// Functions: loadVotesList, submitVote, showVoteDetail, displayVotes

async function loadVotesList() {
    try {
        const response = await fetch('/api/votes', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const votes = await response.json();
        displayVotes(votes);
    } catch (error) {
        console.error('Error loading votes:', error);
    }
}

function displayVotes(votes) {
    const tableBody = document.getElementById('votesTableBody');
    if (!tableBody) return;
    tableBody.innerHTML = '';
    votes.forEach(vote => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${vote.Title}</td><td>${vote.Status}</td><td>${formatDate(vote.StartDate)}</td><td>${formatDate(vote.EndDate)}</td>`;
        tableBody.appendChild(row);
    });
}

async function submitVote(voteId, selectedOption) {
    try {
        const response = await fetch(`/api/votes/${voteId}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ option: selectedOption })
        });
        return response.ok;
    } catch (error) {
        console.error('Error submitting vote:', error);
        return false;
    }
}
