$(function () {
  // Sama dengan document.addEventListener("DOMContentLoaded"...

  // Sama dengan document.querySelector("#navbarToggle").addEventListener("blur",...
  $("#navbarToggle").blur(function (event) {
    var screenWidth = window.innerWidth;
    if (screenWidth < 768) {
      $("#collapsable-nav").collapse("hide");
    }
  });

  // Di Firefox dan Safari, event click tidak mempertahankan fokus
  // pada tombol yang diklik. Oleh karena itu, event blur tidak akan
  // dipanggil ketika pengguna mengklik di tempat lain di halaman
  // Referensi ke issue #28 di repo.
  // Solusi: paksa fokus pada elemen yang menjadi target event click
  $("#navbarToggle").click(function (event) {
    $(event.target).focus();
  });
});

(function (global) {
  var dc = {};

  var homeHtmlUrl = "snippets/home-snippet.html";
  var allCategoriesUrl =
    "https://coursera-jhu-default-rtdb.firebaseio.com/categories.json";
  var categoriesTitleHtml = "snippets/categories-title-snippet.html";
  var categoryHtml = "snippets/category-snippet.html";
  var menuItemsUrl =
    "https://coursera-jhu-default-rtdb.firebaseio.com/menu_items/";
  var menuItemsTitleHtml = "snippets/menu-items-title.html";
  var menuItemHtml = "snippets/menu-item.html";

  // Fungsi bantu untuk menyisipkan innerHTML ke dalam elemen 'select'
  var insertHtml = function (selector, html) {
    var targetElem = document.querySelector(selector);
    targetElem.innerHTML = html;
  };

  // Fungsi untuk menampilkan ikon loading di dalam elemen yang diidentifikasi oleh 'selector'.
  var showLoading = function (selector) {
    var html = "<div class='text-center'>";
    html += "<img src='images/ajax-loader.gif'></div>";
    insertHtml(selector, html);
  };

  // Fungsi untuk mengganti nilai dari '{{propName}}' dengan propValue di dalam 'string' yang diberikan
  var insertProperty = function (string, propName, propValue) {
    var propToReplace = "{{" + propName + "}}";
    string = string.replace(new RegExp(propToReplace, "g"), propValue);
    return string;
  };

  // Fungsi untuk menghapus kelas 'active' dari tombol Home dan beralih ke tombol Menu
  var switchMenuToActive = function () {
    // Hapus 'active' dari tombol Home
    var classes = document.querySelector("#navHomeButton").className;
    classes = classes.replace(new RegExp("active", "g"), "");
    document.querySelector("#navHomeButton").className = classes;

    // Tambahkan 'active' ke tombol menu jika belum ada
    classes = document.querySelector("#navMenuButton").className;
    if (classes.indexOf("active") == -1) {
      classes += " active";
      document.querySelector("#navMenuButton").className = classes;
    }
  };

  // Ketika halaman dimuat (sebelum gambar atau CSS)
  document.addEventListener("DOMContentLoaded", function (event) {
    // Pada muat pertama, tampilkan tampilan utama
    showLoading("#main-content");
    $ajaxUtils.sendGetRequest(
      allCategoriesUrl,
      buildAndShowHomeHTML, // Mengganti nilai [] dengan fungsi yang sesuai
      true
    ); // Menetapkan flag untuk mendapatkan JSON dari server yang diproses menjadi objek literal
  });

  // Fungsi untuk membangun dan menampilkan halaman utama berdasarkan kategori yang dipilih secara acak dari server
  function buildAndShowHomeHTML(categories) {
    // Muat snippet halaman utama
    $ajaxUtils.sendGetRequest(
      homeHtmlUrl,
      function (homeHtml) {
        // Pilih kategori secara acak
        var chosenCategory = chooseRandomCategory(categories);
        var chosenCategoryShortName = chosenCategory.short_name;

        // Ganti '{{randomCategoryShortName}}' di dalam snippet HTML halaman utama dengan kategori yang dipilih
        var homeHtmlToInsertIntoMainPage = insertProperty(
          homeHtml,
          "randomCategoryShortName",
          chosenCategoryShortName
        );

        // Sisipkan HTML yang dihasilkan ke dalam halaman utama
        insertHtml("#main-content", homeHtmlToInsertIntoMainPage);
      },
      false
    ); // False di sini karena kita hanya mendapatkan HTML biasa dari server, jadi tidak perlu memproses JSON.
  }

  // Fungsi untuk memilih kategori secara acak dari daftar kategori yang diberikan
  function chooseRandomCategory(categories) {
    // Pilih indeks acak ke dalam array (mulai dari 0 inklusif hingga panjang array (eksklusif))
    var randomArrayIndex = Math.floor(Math.random() * categories.length);

    // Kembalikan objek kategori dengan indeks acak tersebut
    return categories[randomArrayIndex];
  }

  // Muat tampilan kategori menu
  dc.loadMenuCategories = function () {
    showLoading("#main-content");
    $ajaxUtils.sendGetRequest(allCategoriesUrl, buildAndShowCategoriesHTML);
  };

  // Muat tampilan item menu
  // 'categoryShort' adalah short_name untuk kategori
  dc.loadMenuItems = function (categoryShort) {
    showLoading("#main-content");
    $ajaxUtils.sendGetRequest(
      menuItemsUrl + categoryShort + ".json",
      buildAndShowMenuItemsHTML
    );
  };

  // Fungsi untuk membangun dan menampilkan halaman kategori menu berdasarkan data dari server
  function buildAndShowCategoriesHTML(categories) {
    // Muat snippet judul kategori dari halaman
    $ajaxUtils.sendGetRequest(
      categoriesTitleHtml,
      function (categoriesTitleHtml) {
        // Dapatkan snippet kategori tunggal
        $ajaxUtils.sendGetRequest(
          categoryHtml,
          function (categoryHtml) {
            // Ganti kelas CSS active menjadi tombol menu
            switchMenuToActive();

            var categoriesViewHtml = buildCategoriesViewHtml(
              categories,
              categoriesTitleHtml,
              categoryHtml
            );
            insertHtml("#main-content", categoriesViewHtml);
          },
          false
        );
      },
      false
    );
  }

  // Menggunakan data kategori dan snippets html
  // membangun HTML tampilan kategori untuk dimasukkan ke dalam halaman
  function buildCategoriesViewHtml(
    categories,
    categoriesTitleHtml,
    categoryHtml
  ) {
    var finalHtml = categoriesTitleHtml;
    finalHtml += "<section class='row'>";

    // Loop melalui kategori
    for (var i = 0; i < categories.length; i++) {
      // Sisipkan nilai kategori
      var html = categoryHtml;
      var name = "" + categories[i].name;
      var short_name = categories[i].short_name;
      html = insertProperty(html, "name", name);
      html = insertProperty(html, "short_name", short_name);
      finalHtml += html;
    }

    finalHtml += "</section>";
    return finalHtml;
  }

  // Fungsi untuk membangun dan menampilkan halaman item menu berdasarkan data dari server
  function buildAndShowMenuItemsHTML(categoryMenuItems) {
    // Muat snippet judul halaman item menu
    $ajaxUtils.sendGetRequest(
      menuItemsTitleHtml,
      function (menuItemsTitleHtml) {
        // Dapatkan snippet item menu tunggal
        $ajaxUtils.sendGetRequest(
          menuItemHtml,
          function (menuItemHtml) {
            // Ganti kelas CSS active menjadi tombol menu
            switchMenuToActive();

            var menuItemsViewHtml = buildMenuItemsViewHtml(
              categoryMenuItems,
              menuItemsTitleHtml,
              menuItemHtml
            );
            insertHtml("#main-content", menuItemsViewHtml);
          },
          false
        );
      },
      false
    );
  }

  // Menggunakan data kategori dan item menu serta snippets html
  // membangun HTML tampilan item menu untuk dimasukkan ke dalam halaman
  function buildMenuItemsViewHtml(
    categoryMenuItems,
    menuItemsTitleHtml,
    menuItemHtml
  ) {
    menuItemsTitleHtml = insertProperty(
      menuItemsTitleHtml,
      "name",
      categoryMenuItems.category.name
    );
    menuItemsTitleHtml = insertProperty(
      menuItemsTitleHtml,
      "special_instructions",
      categoryMenuItems.category.special_instructions
    );

    var finalHtml = menuItemsTitleHtml;
    finalHtml += "<section class='row'>";

    // Loop melalui item menu
    var menuItems = categoryMenuItems.menu_items;
    var catShortName = categoryMenuItems.category.short_name;
    for (var i = 0; i < menuItems.length; i++) {
      // Sisipkan nilai item menu
      var html = menuItemHtml;
      html = insertProperty(html, "short_name", menuItems[i].short_name);
      html = insertProperty(html, "catShortName", catShortName);
      html = insertItemPrice(html, "price_small", menuItems[i].price_small);
      html = insertItemPortionName(
        html,
        "small_portion_name",
        menuItems[i].small_portion_name
      );
      html = insertItemPrice(html, "price_large", menuItems[i].price_large);
      html = insertItemPortionName(
        html,
        "large_portion_name",
        menuItems[i].large_portion_name
      );
      html = insertProperty(html, "name", menuItems[i].name);
      html = insertProperty(html, "description", menuItems[i].description);

      // Tambahkan clearfix setelah setiap item menu kedua
      if (i % 2 != 0) {
        html +=
          "<div class='clearfix visible-lg-block visible-md-block'></div>";
      }

      finalHtml += html;
    }

    finalHtml += "</section>";
    return finalHtml;
  }

  // Menambahkan harga dengan '$' jika ada
  function insertItemPrice(html, pricePropName, priceValue) {
    // Jika tidak ditentukan, ganti dengan string kosong
    if (!priceValue) {
      return insertProperty(html, pricePropName, "");
    }

    priceValue = "$" + priceValue.toFixed(2);
    html = insertProperty(html, pricePropName, priceValue);
    return html;
  }

  // Menambahkan nama portion dalam tanda kurung jika ada
  function insertItemPortionName(html, portionPropName, portionValue) {
    // Jika tidak ditentukan, kembalikan string asli
    if (!portionValue) {
      return insertProperty(html, portionPropName, "");
    }

    portionValue = "(" + portionValue + ")";
    html = insertProperty(html, portionPropName, portionValue);
    return html;
  }

  global.$dc = dc;
})(window);
