import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp, 
    deleteDoc, 
    doc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDvYHSzXro4wIrxzBFZItsVEnRh8Pg4nuM",
    authDomain: "zikr-groupe.firebaseapp.com",
    projectId: "zikr-groupe",
    storageBucket: "zikr-groupe.firebasestorage.app",
    messagingSenderId: "640272731972",
    appId: "1:640272731972:web:c3a06660fa19a455b5d111"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let remainingYasin = 41;
let remainingYaLatif = 16641;
let remainingIstighfar = 12000;
let remainingBasmala = 12000;

window.ajouterParticipant = async () => {
    const name = document.getElementById("participantName").value;
    const yasinCount = parseInt(document.getElementById("yasinCount").value) || 0;
    const yaLatifCount = parseInt(document.getElementById("yaLatifCount").value) || 0;
    const istighfarCount = parseInt(document.getElementById("istighfarCount").value) || 0;
    const basmalaCount = parseInt(document.getElementById("basmalaCount").value) || 0;

    if (!name) {
        alert("Veuillez entrer un nom.");
        return;
    }

    if (yasinCount === 0 && yaLatifCount === 0 && istighfarCount === 0 && basmalaCount === 0) {
        alert("Veuillez entrer au moins un nombre de zikr.");
        return;
    }

    // Vérification des limites
    if (yasinCount > remainingYasin) {
        alert(`Il ne reste que ${remainingYasin} Yasin disponibles.`);
        return;
    }
    if (yaLatifCount > remainingYaLatif) {
        alert(`Il ne reste que ${remainingYaLatif} Ya Latif disponibles.`);
        return;
    }
    if (istighfarCount > remainingIstighfar) {
        alert(`Il ne reste que ${remainingIstighfar} Istighfar disponibles.`);
        return;
    }
    if (basmalaCount > remainingBasmala) {
        alert(`Il ne reste que ${remainingBasmala} Basmala disponibles.`);
        return;
    }

    try {
        await addDoc(collection(db, "zikr"), {
            name,
            yasinCount,
            yaLatifCount,
            istighfarCount,
            basmalaCount,
            yasinCompleted: false,
            yaLatifCompleted: false,
            istighfarCompleted: false,
            basmalaCompleted: false,
            timestamp: serverTimestamp()
        });
        
        // Réinitialisation du formulaire
        document.getElementById("participantName").value = "";
        document.getElementById("yasinCount").value = "";
        document.getElementById("yaLatifCount").value = "";
        document.getElementById("istighfarCount").value = "";
        document.getElementById("basmalaCount").value = "";
        showMessage("Zikr ajouté avec succès !");
    } catch (error) {
        alert("Erreur lors de l'ajout: " + error.message);
    }
};

window.supprimerParticipant = async (docId) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette entrée ?")) {
        try {
            await deleteDoc(doc(db, "zikr", docId));
            showMessage("Entrée supprimée avec succès");
        } catch (error) {
            alert("Erreur lors de la suppression: " + error.message);
        }
    }
};

window.updateCompletion = async (docId, field, completed) => {
    try {
        const docRef = doc(db, "zikr", docId);
        const updateData = {};
        updateData[`${field}Completed`] = completed;
        await updateDoc(docRef, updateData);
        showMessage(`${field} marqué comme ${completed ? 'terminé' : 'non terminé'}`);
    } catch (error) {
        alert("Erreur lors de la mise à jour: " + error.message);
    }
};

function showMessage(message) {
    const messageDiv = document.getElementById("successMessage");
    messageDiv.textContent = message;
    messageDiv.style.display = "block";
    setTimeout(() => {
        messageDiv.style.display = "none";
    }, 3000);
}

function updateRemainingCounts(snapshot) {
    let totalYasin = 0;
    let totalYaLatif = 0;
    let totalIstighfar = 0;
    let totalBasmala = 0;

    snapshot.forEach((doc) => {
        const data = doc.data();
        totalYasin += data.yasinCount || 0;
        totalYaLatif += data.yaLatifCount || 0;
        totalIstighfar += data.istighfarCount || 0;
        totalBasmala += data.basmalaCount || 0;
    });

    remainingYasin = 41 - totalYasin;
    remainingYaLatif = 16641 - totalYaLatif;
    remainingIstighfar = 12000 - totalIstighfar;
    remainingBasmala = 12000 - totalBasmala;

    document.getElementById("remainingYasin").textContent = remainingYasin;
    document.getElementById("remainingYaLatif").textContent = remainingYaLatif;
    document.getElementById("remainingIstighfar").textContent = remainingIstighfar;
    document.getElementById("remainingBasmala").textContent = remainingBasmala;
}

function chargerParticipants() {
    const q = query(collection(db, "zikr"), orderBy("timestamp", "desc"));
    
    onSnapshot(q, (snapshot) => {
        const table = document.getElementById("participantTable");
        table.innerHTML = "";

        updateRemainingCounts(snapshot);

        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = table.insertRow();
            
            // Nom
            const nameCell = row.insertCell(0);
            nameCell.setAttribute('data-label', 'Nom');
            nameCell.textContent = data.name;

            // Yasin avec checkbox
            const yasinCell = row.insertCell(1);
            yasinCell.setAttribute('data-label', 'Yasin');
            yasinCell.innerHTML = `${data.yasinCount || 0} <input type="checkbox" 
                ${data.yasinCompleted ? 'checked' : ''} 
                onchange="updateCompletion('${doc.id}', 'yasin', this.checked)">`;

            // Ya Latif avec checkbox
            const yaLatifCell = row.insertCell(2);
            yaLatifCell.setAttribute('data-label', 'Ya Latif');
            yaLatifCell.innerHTML = `${data.yaLatifCount || 0} <input type="checkbox" 
                ${data.yaLatifCompleted ? 'checked' : ''} 
                onchange="updateCompletion('${doc.id}', 'yaLatif', this.checked)">`;

            // Istighfar avec checkbox
            const istighfarCell = row.insertCell(3);
            istighfarCell.setAttribute('data-label', 'Istighfar');
            istighfarCell.innerHTML = `${data.istighfarCount || 0} <input type="checkbox" 
                ${data.istighfarCompleted ? 'checked' : ''} 
                onchange="updateCompletion('${doc.id}', 'istighfar', this.checked)">`;

            // Basmala avec checkbox
            const basmalaCell = row.insertCell(4);
            basmalaCell.setAttribute('data-label', 'Basmala');
            basmalaCell.innerHTML = `${data.basmalaCount || 0} <input type="checkbox" 
                ${data.basmalaCompleted ? 'checked' : ''} 
                onchange="updateCompletion('${doc.id}', 'basmala', this.checked)">`;
            
            // Bouton Supprimer
            const deleteCell = row.insertCell(5);
            deleteCell.setAttribute('data-label', 'Actions');
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Supprimer";
            deleteButton.className = "delete-btn";
            deleteButton.onclick = () => supprimerParticipant(doc.id);
            deleteCell.appendChild(deleteButton);
        });
    });
}

// Démarrer l'application
chargerParticipants();