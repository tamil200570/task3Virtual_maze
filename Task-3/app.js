
let studentManager; 
let uiManager;      
let currentView = "dashboard"; 


// 1. STUDENT CLASS (Represents a Student Entity)
class Student {
    constructor(name, email, age, dept, tamil, english, maths, science, social) {
        this.name = name;
        this.email = email;
        this.age = Number(age);
        this.dept = dept;
        this.tamil = Number(tamil);
        this.english = Number(english);
        this.maths = Number(maths);
        this.science = Number(science);
        this.social = Number(social);
    }

    // Method to calculate total marks for 5 subjects
    calculateTotal() {
        return this.tamil + this.english + this.maths + this.science + this.social;
    }

    // Static helper method to calculate grade based on mark
    static getGrade(mark) {
        let m = Number(mark);
        if (m >= 90) return 'A+';
        if (m >= 80) return 'A';
        if (m >= 70) return 'B';
        if (m >= 60) return 'C';
        if (m >= 50) return 'D';
        return 'F';
    }

    // Convert instance to plain object for localStorage
    toJSON() {
        return {
            name: this.name,
            email: this.email,
            age: this.age,
            dept: this.dept,
            tamil: this.tamil,
            english: this.english,
            maths: this.maths,
            science: this.science,
            social: this.social
        };
    }

    // Factory method to construct Student from stored object
    static fromJSON(data) {
        if (!data) return new Student("", "", 0, "", 0, 0, 0, 0, 0);
        return new Student(
            data.name || "",
            data.email || "",
            data.age || 0,
            data.dept || "",
            data.tamil || 0,
            data.english || 0,
            data.maths || 0,
            data.science || 0,
            data.social || 0
        );
    }
}


class StudentManager {
    constructor(storageKey = "students") {
        this.storageKey = storageKey;
        this.students = [];
        this.loadStudents();
    }

    // Load students from LocalStorage
    loadStudents() {
        let rawData = localStorage.getItem(this.storageKey);
        if (rawData) {
            try {
                let parsed = JSON.parse(rawData);
                if (Array.isArray(parsed)) {
                    this.students = parsed.map(item => Student.fromJSON(item));
                } else {
                    this.students = [];
                }
            } catch (e) {
                console.error("Error reading students from localStorage:", e);
                this.students = [];
            }
        } else {
            this.students = [];
        }
        return this.students;
    }

    // Save students back to LocalStorage
    saveStudents() {
        let plainData = this.students.map(s => s.toJSON());
        localStorage.setItem(this.storageKey, JSON.stringify(plainData));
    }

    // Add a new student
    addStudent(student) {
        this.students.push(student);
        this.saveStudents();
    }

    // Delete a student by index
    deleteStudent(index) {
        if (index >= 0 && index < this.students.length) {
            this.students.splice(index, 1);
            this.saveStudents();
            return true;
        }
        return false;
    }

    // Calculate statistics for the Dashboard
    getStatistics() {
        let totalCount = this.students.length;
        if (totalCount === 0) {
            return {
                totalCount: 0,
                averageMark: 0,
                highestMark: 0,
                lowestMark: 0
            };
        }

        let totals = this.students.map(s => s.calculateTotal());
        let highestMark = Math.max(...totals);
        let lowestMark = Math.min(...totals);
        let sum = totals.reduce((acc, curr) => acc + curr, 0);
        let averageMark = (sum / totalCount).toFixed(2);

        return {
            totalCount: totalCount,
            averageMark: averageMark,
            highestMark: highestMark,
            lowestMark: lowestMark
        };
    }

    // Search and filter students by query
    filterStudents(query) {
        let q = (query || "").toLowerCase().trim();
        if (!q) {
            return this.students.map((student, index) => ({ student, index }));
        }

        return this.students
            .map((student, index) => ({ student, index }))
            .filter(item => {
                let s = item.student;
                return (
                    (s.name && s.name.toLowerCase().includes(q)) ||
                    (s.email && s.email.toLowerCase().includes(q)) ||
                    (s.dept && s.dept.toLowerCase().includes(q))
                );
            });
    }
}


class UIManager {
    constructor(studentManager) {
        this.manager = studentManager;
    }

    // Initialize listeners and router
    init() {
        this.setupNavigation();
        this.setupForm();
        this.setupSearch();
        this.handleInitialRoute();
    }

    // SPA Navigation Setup
    setupNavigation() {
        // Intercept all link clicks for SPA page transitions without reload
        document.addEventListener("click", (event) => {
            let link = event.target.closest("a");
            if (!link) return;

            let href = link.getAttribute("href");
            if (!href) return;

            if (href.indexOf("Add-Student.html") !== -1 || href === "#add-student") {
                event.preventDefault();
                this.showView("add-student");
            } else if (href.indexOf("Student-List.html") !== -1 || href === "#student-list") {
                event.preventDefault();
                this.showView("student-list");
            } else if (href.indexOf("Dashboard.html") !== -1 || href === "#dashboard") {
                event.preventDefault();
                this.showView("dashboard");
            }
        });

        // Listen for browser back/forward buttons
        window.addEventListener("hashchange", () => {
            let hash = window.location.hash.replace("#", "").trim();
            let targetView = (hash === "add-student" || hash === "student-list") ? hash : "dashboard";
            if (currentView !== targetView) {
                this.showView(targetView, false);
            }
        });
    }

    // Switch between SPA views without page reload
    showView(viewId, updateHash = true) {
        let dashboardView = document.getElementById("view-dashboard");
        let addStudentView = document.getElementById("view-add-student");
        let studentListView = document.getElementById("view-student-list");

        if (!dashboardView || !addStudentView || !studentListView) return;

        dashboardView.classList.remove("active");
        addStudentView.classList.remove("active");
        studentListView.classList.remove("active");

        currentView = viewId;

        if (viewId === "add-student") {
            addStudentView.classList.add("active");
            if (updateHash && window.location.hash !== "#add-student") {
                window.location.hash = "#add-student";
            }
        } else if (viewId === "student-list") {
            studentListView.classList.add("active");
            if (updateHash && window.location.hash !== "#student-list") {
                window.location.hash = "#student-list";
            }
            this.renderStudentList();
        } else {
            dashboardView.classList.add("active");
            if (updateHash && window.location.hash !== "#dashboard" && window.location.hash !== "") {
                window.location.hash = "#dashboard";
            }
            this.updateDashboard();
        }
    }

    handleInitialRoute() {
        let hash = window.location.hash.replace("#", "").trim();
        let initialView = (hash === "add-student" || hash === "student-list") ? hash : "dashboard";
        this.showView(initialView, false);
    }

    // Update Dashboard DOM elements
    updateDashboard() {
        let stats = this.manager.getStatistics();
        let noOfStudents = document.getElementById("no-of-students");
        let avgMark = document.getElementById("Avg-mark");
        let highMark = document.getElementById("high-mark");
        let lowMark = document.getElementById("low-mark");

        if (noOfStudents) noOfStudents.textContent = stats.totalCount;
        if (avgMark) avgMark.textContent = stats.averageMark;
        if (highMark) highMark.textContent = stats.highestMark;
        if (lowMark) lowMark.textContent = stats.lowestMark;
    }

    // Render Student Cards in the Student List view
    renderStudentList(filteredItems = null) {
        let box = document.getElementById("box");
        if (!box) return;

        box.innerHTML = "";

        let itemsToRender = filteredItems;
        if (!itemsToRender) {
            itemsToRender = this.manager.students.map((student, index) => ({
                student: student,
                index: index
            }));
        }

        if (itemsToRender.length === 0) {
            box.innerHTML = "<p>No Student Details Available.</p>";
            return;
        }

        itemsToRender.forEach(item => {
            let s = item.student;
            let idx = item.index;
            let total = s.calculateTotal();

            box.innerHTML += `
    <div class="student-card">

        <h2>${s.name}</h2>

        <p>Email: ${s.email}</p>

        <p>Age: ${s.age}</p>

        <p>Department: ${s.dept}</p>

        <div class="marks-header">
            <span>Subject</span>
            <span>Mark</span>
            <span>Grade</span>
        </div>

        <div class="marks-row">
            <span>Tamil</span>
            <span>${s.tamil}</span>
            <span>${Student.getGrade(s.tamil)}</span>
        </div>

        <div class="marks-row">
            <span>English</span>
            <span>${s.english}</span>
            <span>${Student.getGrade(s.english)}</span>
        </div>

        <div class="marks-row">
            <span>Maths</span>
            <span>${s.maths}</span>
            <span>${Student.getGrade(s.maths)}</span>
        </div>

        <div class="marks-row">
            <span>Science</span>
            <span>${s.science}</span>
            <span>${Student.getGrade(s.science)}</span>
        </div>

        <div class="marks-row">
            <span>Social</span>
            <span>${s.social}</span>
            <span>${Student.getGrade(s.social)}</span>
        </div>

        <p class="total-mark">
            Total-Mark: ${total}
        </p>

        <button type="button" onclick="deleteData(${idx})">
            Delete-Details
        </button>

    </div>
`;
        });
    }

    // Form Submission Handler & Validation
    setupForm() {
        let form = document.getElementById("submit");
        if (!form) return;

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            let std_name = (document.getElementById("sname")?.value || "").trim();
            let std_email = (document.getElementById("smail")?.value || "").trim();
            let std_age = (document.getElementById("sage")?.value || "").trim();
            let std_dept = (document.getElementById("sdept")?.value || "").trim();

            let std_stamil = (document.getElementById("stm")?.value || "").trim();
            let std_senglish = (document.getElementById("sem")?.value || "").trim();
            let std_sscience = (document.getElementById("ssm")?.value || "").trim();
            let std_ssocial = (document.getElementById("som")?.value || "").trim();
            let std_smaths = (document.getElementById("smm")?.value || "").trim();

            // Original Validation Rules
            let namapattern = /^[A-Za-z. ]+$/;
            let emailpattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            let deeptpattern = /^[A-Za-z ]+$/;

            if (std_name === "") {
                alert("Name is required");
                return;
            }
            if (!namapattern.test(std_name)) {
                alert("Name must contain only letters");
                return;
            }
            if (std_email === "") {
                alert("Email is required");
                return;
            }
            if (!emailpattern.test(std_email)) {
                alert("Please enter a valid email");
                return;
            }
            if (std_age === "") {
                alert("Age is required");
                return;
            }
            let age = Number(std_age);
            if (isNaN(age) || age < 15 || age >= 25) {
                alert("Age must be between 15 and 24");
                return;
            }
            if (std_dept === "") {
                alert("Department is required");
                return;
            }
            if (!deeptpattern.test(std_dept)) {
                alert("Department must contain only letters");
                return;
            }

            let marks = [std_stamil, std_senglish, std_smaths, std_sscience, std_ssocial];
            for (let mark of marks) {
                if (mark === "") {
                    alert("All subject marks are required");
                    return;
                }
                let markvalue = Number(mark);
                if (isNaN(markvalue) || markvalue < 0 || markvalue > 100) {
                    alert("Marks must be between 0 and 100");
                    return;
                }
            }

            // Create new Student instance
            let newStudent = new Student(
                std_name,
                std_email,
                std_age,
                std_dept,
                std_stamil,
                std_senglish,
                std_smaths,
                std_sscience,
                std_ssocial
            );

            // Add to manager & save
            this.manager.addStudent(newStudent);
            alert("Student details saved successfully");
            form.reset();
            this.updateDashboard();
        });
    }

    // Search and Filter Setup
    setupSearch() {
        let searchInput = document.getElementById("search-input");
        let searchForm = document.getElementById("search-form");

        if (searchInput) {
            searchInput.addEventListener("input", () => {
                let filtered = this.manager.filterStudents(searchInput.value);
                this.renderStudentList(filtered);
            });
        }

        if (searchForm) {
            searchForm.addEventListener("reset", () => {
                setTimeout(() => {
                    this.renderStudentList();
                }, 0);
            });
        }
    }
}


function deleteData(index) {
    let confirmDelete = confirm("Are you sure you want to delete this student?");
    if (confirmDelete) {
        studentManager.deleteStudent(index);
        let searchInput = document.getElementById("search-input");
        if (searchInput && searchInput.value.trim() !== "") {
            let filtered = studentManager.filterStudents(searchInput.value);
            uiManager.renderStudentList(filtered);
        } else {
            uiManager.renderStudentList();
        }
        uiManager.updateDashboard();
    }
}


function getGrade(mark) {
    return Student.getGrade(mark);
}

document.addEventListener("DOMContentLoaded", function () {
    // Instantiate classes and assign to global variables
    studentManager = new StudentManager("students");
    uiManager = new UIManager(studentManager);
    uiManager.init();
});
