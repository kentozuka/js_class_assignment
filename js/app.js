// requesting when the page is loaded
window.addEventListener('DOMContentLoaded', async () => {
  // total number
  const ttt = await axios.get('https://api.covid19api.com/world/total')
  const confirmedHolder = document.getElementById('total-confirmed')
  const deathsHolder = document.getElementById('total-deaths')
  const recoveredHolder = document.getElementById('total-recovered')
  confirmedHolder.innerText = numberWithComma(ttt.data.TotalConfirmed)
  deathsHolder.innerText = numberWithComma(ttt.data.TotalDeaths)
  recoveredHolder.innerText = numberWithComma(ttt.data.TotalRecovered)
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
    maxZoom: 5,
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
        label: 'Please select a country',
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
  selector.addEventListener('change', () => selected(chart, map))
})

async function selected(target, map) {
  const name = document.getElementById('country-selection').value
  const api = await axios.get(`https://api.covid19api.com/country/${name}`)
  // for leaflet
  const lat = api.data ? api.data[0].Lat : '0'
  const lon = api.data ? api.data[0].Lon : '0'
  const pss = [lat, lon]

  const conf = api.data.map(x => x.Confirmed)
  const deat = api.data.map(x => x.Deaths)
  const reco = api.data.map(x => x.Recovered)
  const dates = api.data.map(x => {
    const dt = new Date(x.Date)
    return `${dt.getMonth() + 1}/${dt.getDate()}`
  })

  const size = {
    conf: (conf[conf.length - 1] / totals().conf) * 10000000,
    deat: (deat[deat.length - 1] / totals().deat) * 10000000,
    reco: (reco[reco.length - 1] / totals().reco) * 10000000
  }
  circles(map, size, pss)

  // modifying chart
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
  // manipulating leaflets
  if (lat && lon) map.panTo(pss)
}

function circles(map, size, pss) {
  const colors = {
    border: {
      conf: 'blue',
      deat: 'red',
      reco: 'green',
    },
    fill: {
      conf: '',
      deat: '',
      reco: ''
    }
  }
  for (const em in size) {
    L.circle(pss, {
      color: colors.border[em],
      fillColor: colors.fill[em],
      fillOpacity: 0.2,
      radius: size[em],
    }).addTo(map)
  }
}

function chart(chart, datasets, labels) {
  chart.data = {
    labels,
    datasets
  }
  chart.update()
}

// getting totals
function totals() {
  const confirmedHolder = document.getElementById('total-confirmed')
  const deathsHolder = document.getElementById('total-deaths')
  const recoveredHolder = document.getElementById('total-recovered')
  return {
    conf: number(confirmedHolder.innerText),
    deat: number(deathsHolder.innerText),
    reco: number(recoveredHolder.innerText)
  }
}

// saving a few lines of code here
function write(parent, node) {
  parent.appendChild(node)
}

function numberWithComma(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

function number(x) {
  return parseInt(x.match(/\d+/g).join(''))
}
