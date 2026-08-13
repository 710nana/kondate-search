let menuData = [];
let currentRanking = [];


// CSVを読み込む
fetch("menu.csv")
    .then(response => response.arrayBuffer())
    .then(buffer => {
        const decoder = new TextDecoder("utf-8");
        const text = decoder.decode(buffer);

        menuData = parseCSV(text);

        console.log("CSV読込完了", menuData);
    });


// CSVを配列化
function parseCSV(text) {

    const lines = text.trim().split(/\r?\n/);

    const data = [];

    for (let i = 1; i < lines.length; i++) {

        const columns = lines[i].split(",");

        data.push({
            date: columns[0] || "",
            menus: columns.slice(1)
        });

    }

    return data;
}


// 検索
function searchMenu() {

    const keyword = document
        .getElementById("searchInput")
        .value
        .trim();

    const resultsElement =
        document.getElementById("results");


    // 未入力
    if (keyword === "") {

        resultsElement.innerHTML = `
            <div class="no-result">
                料理名を入力してください
            </div>
        `;

        return;
    }


    // =========================
    // 部分一致検索
    // =========================

    const results = menuData.filter(day => {

        return day.menus.some(menu => {

            return menu
                .trim()
                .includes(keyword);

        });

    });


    // 該当なし
    if (results.length === 0) {

        resultsElement.innerHTML = `
            <div class="no-result">
                「${escapeHTML(keyword)}」
                に一致する献立はありませんでした。
            </div>
        `;

        return;
    }


    // =========================
    // 一緒に作った料理集計
    // =========================

    const togetherCounts = {};

    results.forEach(day => {

        day.menus.forEach(menu => {

            const cleanMenu = menu.trim();

            if (cleanMenu === "") {
                return;
            }

            // 検索料理は除外
            if (cleanMenu.includes(keyword)) {
                return;
            }

            if (togetherCounts[cleanMenu]) {

                togetherCounts[cleanMenu]++;

            } else {

                togetherCounts[cleanMenu] = 1;

            }

        });

    });


    // =========================
    // 並び替え
    // =========================

    const ranking = Object.entries(togetherCounts)
        .sort((a, b) => {

            if (b[1] !== a[1]) {
                return b[1] - a[1];
            }

            return a[0].localeCompare(
                b[0],
                "ja"
            );

        });


    // =========================
    // 同率順位
    // =========================

    let currentRank = 0;
    let previousCount = null;

    currentRanking = ranking.map((item, index) => {

        const menuName = item[0];
        const count = item[1];

        if (count !== previousCount) {
            currentRank = index + 1;
        }

        previousCount = count;

        return {
            rank: currentRank,
            menuName: menuName,
            count: count
        };

    });


    // =========================
    // ランキングHTML
    // =========================

    const rankingHTML =
        createRankingHTML(
            currentRanking,
            keyword
        );


    // =========================
    // 献立表示
    // =========================

    const resultsHTML = results.map(day => {

        // 検索した料理
        const matchedMenus =
            day.menus.filter(menu => {

                return menu
                    .trim()
                    .includes(keyword);

            });


        // 一緒に作った料理
        const togetherMenus =
            day.menus.filter(menu => {

                const clean =
                    menu.trim();

                return (
                    clean !== "" &&
                    !clean.includes(keyword)
                );

            });


        return `

            <div class="result">

                <div class="date">
                    📅 ${escapeHTML(day.date)}
                </div>

                <div class="section">

                    <div class="section-title">
                        ⭐ 検索した料理
                    </div>

                    ${matchedMenus.map(menu => `
                        <div class="matched-menu">
                            ${escapeHTML(menu)}
                        </div>
                    `).join("")}

                </div>

                <br>

                <div class="section">

                    <div class="section-title">
                        🍽 一緒に作った料理
                    </div>

                    ${
                        togetherMenus.length > 0

                        ? togetherMenus.map(menu => `
                            <div class="together-menu">
                                ・${escapeHTML(menu)}
                            </div>
                        `).join("")

                        : `
                            <div class="no-together">
                                他の料理はありません
                            </div>
                        `
                    }

                </div>

            </div>

        `;

    }).join("");


    // =========================
    // 表示
    // =========================

    resultsElement.innerHTML = `

        <p>
            「${escapeHTML(keyword)}」
            の検索結果：
            ${results.length}件
        </p>

        ${rankingHTML}

        <div class="results-space"></div>

        <div class="results-title">
            📋 過去の献立
        </div>

        ${resultsHTML}

    `;
}


// ランキングHTML
function createRankingHTML(ranking, keyword) {

    const top3 = ranking.slice(0, 3);

    return `

        <div class="ranking-box">

            <h2>
                🏆 「${escapeHTML(keyword)}」と
                一緒に作った料理ランキング
            </h2>

            <div id="rankingList">

                ${createRankingItems(top3)}

            </div>

            ${
                ranking.length > 3

                ? `
                    <button
                        class="more-button"
                        onclick="showMoreRanking()"
                    >
                        もっと見る
                    </button>
                `

                : ""
            }

        </div>

    `;
}


// ランキング項目
function createRankingItems(ranking) {

    return ranking.map(item => {

        let mark;

        if (item.rank === 1) {
            mark = "🥇";
        }
        else if (item.rank === 2) {
            mark = "🥈";
        }
        else if (item.rank === 3) {
            mark = "🥉";
        }
        else {
            mark = `${item.rank}位`;
        }

        return `

            <div class="ranking-item">

                <span class="rank">
                    ${mark}
                </span>

                <span class="ranking-menu">
                    ${escapeHTML(item.menuName)}
                </span>

                <span class="count">
                    ${item.count}回
                </span>

            </div>

        `;

    }).join("");

}


// もっと見る
function showMoreRanking() {

    const top10 =
        currentRanking.slice(0, 10);

    document.getElementById(
        "rankingList"
    ).innerHTML =
        createRankingItems(top10);

    const button =
        document.querySelector(
            ".more-button"
        );

    if (button) {
        button.style.display = "none";
    }
}


// HTML特殊文字
function escapeHTML(text) {

    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// Enter検索
document
    .getElementById("searchInput")
    .addEventListener(
        "keydown",
        function(event) {

            if (event.key === "Enter") {
                searchMenu();
            }

        }
    );