// requesting when the page is loaded
window.addEventListener('DOMContentLoaded', async () => {
  // creating country list
  const cntrs = await axios.get('https://api.covid19api.com/countries')
  const cs = document.getElementById('country-selection')

  // sorting countries by name
  const srtd = cntrs.data.sort((a, b) => {
    // Use toUpperCase() to ignore character casing
    let base = 0
    base = a.Country > b.Country ? 1 : -1
    return base
  })

  for (const cnt of srtd) {
    const v = document.createElement('option')
    v.value = cnt.Slug
    v.text = cnt.Country
    write(cs, v)
  }

  const map = L.map('map').setView([51.505, -0.09], 13)
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoia2VudG96dWthIiwiYSI6ImNrYmZ1cnhyMjByNWczNW55aGh5dTNienoifQ.vb8bmzlya1_ILHRF6S00pA'
  }).addTo(map)

  // initializing a chart
  const ctx = document.getElementById('chart').getContext('2d')
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [0, 0],
      datasets: [{
        label: '# of Cases',
        data: [0, 0]
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  })

  const selector = document.getElementById('country-selection')
  selector.addEventListener('change', () => selected(chart))
})

async function selected(target) {
  const name = document.getElementById('country-selection').value
  const api = await axios.get(`https://api.covid19api.com/country/${name}`)
  console.log(api.data)
  const conf = api.data.map(x => x.Confirmed)
  const deat = api.data.map(x => x.Deaths)
  const reco = api.data.map(x => x.Recovered)
  const dates = api.data.map(x => {
    const dt = new Date(x.Date)
    return `${dt.getMonth() + 1}/${dt.getDate()}`
  })
  const sets = [{
    label: 'Confirmed',
    data: conf,
    borderColor: 'rgba(0, 0, 255, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0)'
  }, {
    label: 'Death',
    data: deat,
    borderColor: 'rgba(255, 0, 0, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0)'
  }, {
    label: 'Recovered',
    data: reco,
    borderColor: 'rgba(0, 255, 0, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0)'
  }]
  chart(target, sets, dates)
}

function chart(chart, datasets, labels) {
  chart.data = {
    labels,
    datasets
  }
  chart.update()
}

// saving a few lines of code here
function write(parent, node) {
  parent.appendChild(node)
}

// deleting elements from target item
function remove(target) {
  const t = document.querySelector(target)
  if (t) t.parentNode.removeChild(t)
}
function reset(item) {
  console.log(item)
}

// create element with class if specified
function create(tag, text, css = null) {
  const item = document.createElement(tag)
  item.innerText = text
  if (css) item.classList.add(css)
}