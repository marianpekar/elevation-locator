class ElevationDataProvider {
  constructor(key) {
    this.elevations = [];
    this.key = key;
  }

  GetElevationData(lat, lon, step, size, Consumer) {
    this.elevations = [];
    this.size = size;

    let latStart = lat - size * step * 0.5;
    let latEnd = lat + size * step * 0.5;

    let lonStart = lon - size * step * 0.5;
    let lonEnd = lon + size * step * 0.5;

    let lans = [];
    let lons = [];

    for (let i = latStart; i <= latEnd; i += step) {
      lans.push(i);
    }

    for (let i = lonStart; i <= lonEnd; i += step) {
      lons.push(i);
    }

    // POST data JSON format example: {"points": [[12.3,45.6],[12.4,23.4]]}
    let postData = '{"points": [';
    for (let i = 0; i < lans.length - 1; i++) {
      postData += `[${parseFloat(lans[i].toFixed(6))},${parseFloat(
        lons[i].toFixed(6)
      )}]${i != lans.length - 2 ? "," : ""}`;
    }
    postData += "]}";

    let requestUrl = `https://elevation-api.io/api/elevation?key=${this.key}`;
    fetch(requestUrl, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
      method: "POST",
      body: postData
    })
      .then(response => response.json())
      .then(data => {
        data.elevations.forEach(element => {
          this.elevations.push(element.elevation);
        });
        Consumer(this.elevations);
      });
  }
}
