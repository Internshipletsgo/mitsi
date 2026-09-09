const API_BASE_URL =
    (window.APP_CONFIG?.apiBaseUrl || "").replace(/\/$/, "");


const state = {

    rows: [],

    filteredRows: [],

    page: 1,

    pageSize: 50

};



const fileInput =
    document.getElementById(
        "fileInput"
    );


const uploadButton =
    document.getElementById(
        "uploadButton"
    );


const recapButton =
    document.getElementById(
        "recapButton"
    );


const tableBody =
    document.getElementById(
        "tableBody"
    );


const dateFrom =
    document.getElementById(
        "dateFrom"
    );


const dateTo =
    document.getElementById(
        "dateTo"
    );


const pageSize =
    document.getElementById(
        "pageSize"
    );


const referenceFilter =
    document.getElementById(
        "referenceFilter"
    );


const payeeFilter =
    document.getElementById(
        "payeeFilter"
    );


const particularsFilter =
    document.getElementById(
        "particularsFilter"
    );


const busFilter =
    document.getElementById(
        "busFilter"
    );


const accountCodeFilter =
    document.getElementById(
        "accountCodeFilter"
    );


const entriesText =
    document.getElementById(
        "entriesText"
    );


const totalDebit =
    document.getElementById(
        "totalDebit"
    );


const totalCredit =
    document.getElementById(
        "totalCredit"
    );


const pageNumbers =
    document.getElementById(
        "pageNumbers"
    );


const prevBtn =
    document.getElementById(
        "prevBtn"
    );


const nextBtn =
    document.getElementById(
        "nextBtn"
    );


const selectAll =
    document.getElementById(
        "selectAll"
    );


const statusText =
    document.getElementById(
        "statusText"
    );


const toast =
    document.getElementById(
        "toast"
    );



function normalizeRow(row) {

    return {

        DATE:
            row.DATE ?? "",

        REFERENCE:
            row.REFERENCE ?? "",

        PAYEE:
            row.PAYEE ?? "",

        PARTICULARS:
            row.PARTICULARS ?? "",

        BUS:
            row.BUS ?? "",

        "ACCOUNT CODE":
            row["ACCOUNT CODE"] ?? "",

        DEBIT:
            Number(
                row.DEBIT ?? 0
            ),

        CREDIT:
            Number(
                row.CREDIT ?? 0
            )

    };

}



function formatMoney(value) {

    return Number(
        value || 0
    ).toLocaleString(
        "en-US",
        {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }
    );

}



function formatDate(value) {

    if (!value) {

        return "";

    }


    const date =
        new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? value + "T00:00:00" : value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        "en-US",
        {

            month: "short",

            day: "2-digit",

            year: "numeric"

        }
    );

}



function showToast(message) {

    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}



/* ===================================
UPLOAD
=================================== */

uploadButton.addEventListener(
    "click",
    () => {

        fileInput.click();

    }
);



fileInput.addEventListener(
    "change",
    () => {

        const file =
            fileInput.files[0];


        if (!file) {

            return;

        }


        uploadExcel(file);

    }
);



async function uploadExcel(file) {
    uploadButton.disabled = true;
    statusText.textContent = "Uploading and parsing Excel file...";
    const formData = new FormData();
    formData.append("file", file);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
        const response = await fetch(API_BASE_URL + "/upload", {
            method: "POST", body: formData, signal: controller.signal
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "The upload failed.");
        if (!Array.isArray(result.rows)) throw new Error("Unexpected response from the backend.");
        state.rows = result.rows.map(normalizeRow);
        state.page = 1;
        selectAll.checked = false;
        applyFilters();
        const warnings = result.diagnostics?.warnings || [];
        statusText.textContent = `Loaded ${state.rows.length} parsed rows. ` + warnings.join(" ");
        showToast(state.rows.length ? "Excel parsed successfully!" : "No payable entries found.");
    } catch (error) {
        const message = error.name === "AbortError" ? "Upload timed out. Try a smaller workbook."
            : error instanceof TypeError ? "Cannot reach the backend. Check that the server is running."
            : error.message;
        statusText.textContent = message;
        showToast(message);
    } finally {
        clearTimeout(timeout);
        uploadButton.disabled = false;
        fileInput.value = "";
    }
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
}

/* ===================================
FILTERS
=================================== */

function applyFilters() {

    const reference =
        referenceFilter.value
            .toLowerCase()
            .trim();


    const payee =
        payeeFilter.value
            .toLowerCase()
            .trim();


    const particulars =
        particularsFilter.value
            .toLowerCase()
            .trim();


    const bus =
        busFilter.value
            .toLowerCase()
            .trim();


    const account =
        accountCodeFilter.value
            .toLowerCase()
            .trim();


    state.pageSize =
        Number(
            pageSize.value
        );


    state.filteredRows =
        state.rows.filter(
            row => {
                const date = String(row.DATE || "").slice(0, 10);
                if (dateFrom.value && (!date || date < dateFrom.value)) return false;
                if (dateTo.value && (!date || date > dateTo.value)) return false;

                if (
                    reference &&
                    !String(
                        row.REFERENCE
                    )
                    .toLowerCase()
                    .includes(
                        reference
                    )
                ) {

                    return false;

                }


                if (
                    payee &&
                    !String(
                        row.PAYEE
                    )
                    .toLowerCase()
                    .includes(
                        payee
                    )
                ) {

                    return false;

                }


                if (
                    particulars &&
                    !String(
                        row.PARTICULARS
                    )
                    .toLowerCase()
                    .includes(
                        particulars
                    )
                ) {

                    return false;

                }


                if (
                    bus &&
                    !String(
                        row.BUS
                    )
                    .toLowerCase()
                    .includes(
                        bus
                    )
                ) {

                    return false;

                }


                if (
                    account &&
                    !String(
                        row["ACCOUNT CODE"]
                    )
                    .toLowerCase()
                    .includes(
                        account
                    )
                ) {

                    return false;

                }


                return true;

            }
        );


    state.page = 1;


    render();

}



/* ===================================
RENDER TABLE
=================================== */

function render() {

    renderTable();

    renderTotals();

    renderPagination();

}



function renderTable() {

    tableBody.innerHTML =
        "";


    const total =
        state.filteredRows.length;


    const start =
        (
            state.page - 1
        )
        *
        state.pageSize;


    const end =
        Math.min(
            start
            +
            state.pageSize,

            total
        );


    const rows =
        state.filteredRows.slice(
            start,
            end
        );


    if (
        rows.length === 0
    ) {


        for (
            let i = 0;
            i < 5;
            i++
        ) {


            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>
                    <input
                        type="checkbox"
                        disabled
                    />
                </td>

                <td></td>

                <td></td>

                <td></td>

                <td></td>

                <td></td>

                <td></td>

                <td></td>

                <td class="money">
                    -
                </td>

            `;


            tableBody.appendChild(
                tr
            );

        }


        entriesText.textContent =
            "Showing 0 to 0 of 0 entries";


        return;

    }



    rows.forEach(
        row => {


            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>

                    <input
                        class="row-checkbox"
                        type="checkbox"
                    />

                </td>


                <td>

                    ${formatDate(
                        row.DATE
                    )}

                </td>


                <td>

                    ${escapeHtml(row.REFERENCE)}

                </td>


                <td>

                    ${escapeHtml(row.PAYEE)}

                </td>


                <td>

                    ${escapeHtml(row.PARTICULARS)}

                </td>


                <td>

                    ${escapeHtml(row.BUS)}

                </td>


                <td>

                    ${escapeHtml(row["ACCOUNT CODE"])}

                </td>


                <td class="money">

                    ${formatMoney(
                        row.DEBIT
                    )}

                </td>


                <td class="money">

                    ${formatMoney(
                        row.CREDIT
                    )}

                </td>

            `;


            tableBody.appendChild(
                tr
            );

        }
    );


    entriesText.textContent =
        `Showing ${start + 1} to ${end} of ${total} entries`;

}



/* ===================================
TOTALS
=================================== */

function renderTotals() {

    let debit =
        0;


    let credit =
        0;


    state.filteredRows.forEach(
        row => {

            debit +=
                Number(
                    row.DEBIT || 0
                );


            credit +=
                Number(
                    row.CREDIT || 0
                );

        }
    );


    if (
        state.filteredRows.length === 0
    ) {

        totalDebit.textContent =
            "-";


        totalCredit.textContent =
            "-";

        return;

    }


    totalDebit.textContent =
        formatMoney(
            debit
        );


    totalCredit.textContent =
        formatMoney(
            credit
        );

}



/* ===================================
PAGINATION
=================================== */

function renderPagination() {

    pageNumbers.innerHTML =
        "";


    const totalPages =
        Math.max(
            1,

            Math.ceil(
                state.filteredRows.length
                /
                state.pageSize
            )
        );


    prevBtn.disabled =
        state.page <= 1;


    nextBtn.disabled =
        state.page >=
        totalPages;


    const startPage =
        Math.max(
            1,

            state.page - 1
        );


    const endPage =
        Math.min(
            totalPages,

            startPage + 2
        );


    for (
        let i = startPage;
        i <= endPage;
        i++
    ) {


        const button =
            document.createElement(
                "button"
            );


        button.textContent =
            i;


        button.className =
            "number-btn";


        if (
            i === state.page
        ) {

            button.classList.add(
                "active"
            );

        }


        button.addEventListener(
            "click",
            () => {

                state.page =
                    i;


                render();

            }
        );


        pageNumbers.appendChild(
            button
        );

    }

}



prevBtn.addEventListener(
    "click",
    () => {

        if (
            state.page > 1
        ) {

            state.page--;

            render();

        }

    }
);



nextBtn.addEventListener(
    "click",
    () => {


        const totalPages =
            Math.ceil(
                state.filteredRows.length
                /
                state.pageSize
            );


        if (
            state.page <
            totalPages
        ) {

            state.page++;

            render();

        }

    }
);



/* ===================================
FILTER EVENTS
=================================== */

const filters = [
    dateFrom,
    dateTo,

    referenceFilter,

    payeeFilter,

    particularsFilter,

    busFilter,

    accountCodeFilter,

    pageSize

];


filters.forEach(
    filter => {

        filter.addEventListener(
            "input",
            applyFilters
        );

        filter.addEventListener(
            "change",
            applyFilters
        );

    }
);



/* ===================================
SELECT ALL
=================================== */

selectAll.addEventListener(
    "change",
    () => {


        const checkboxes =
            document.querySelectorAll(
                ".row-checkbox"
            );


        checkboxes.forEach(
            checkbox => {

                checkbox.checked =
                    selectAll.checked;

            }
        );

    }
);



/* ===================================
GENERATE RECAP
=================================== */

recapButton.addEventListener(
    "click",
    () => {


        if (
            state.filteredRows.length === 0
        ) {

            showToast(
                "No data to recap."
            );

            return;

        }


        let debit = 0;

        let credit = 0;


        state.filteredRows.forEach(
            row => {

                debit +=
                    Number(
                        row.DEBIT || 0
                    );


                credit +=
                    Number(
                        row.CREDIT || 0
                    );

            }
        );


        alert(

            "ADDITIONAL PAYABLES RECAP\n\n"

            +

            "Rows: "
            +
            state.filteredRows.length

            +

            "\nTotal Debit: "
            +
            formatMoney(
                debit
            )

            +

            "\nTotal Credit: "
            +
            formatMoney(
                credit
            )

            +

            "\nDifference: "
            +
            formatMoney(
                debit - credit
            )

        );

    }
);



/* ===================================
INITIAL TABLE
=================================== */

render();
