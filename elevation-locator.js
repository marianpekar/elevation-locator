class ElevationDataProvider {
    constructor() {
        this.elevations = [];
    }

    GetElevationData(lat, lon, step, size) {
        this.elevations = [];

        let latStart = lat - size * step * 0.5;
        let latEnd = lat + size * step *  0.5;
        
        let lonStart = lon - size * step * 0.5;
        let lonEnd = lon + size * step * 0.5;
        
        let lans = [];
        let lons = [];
        
        for(let i = latStart; i <= latEnd; i += step) {
            lans.push(i);
        }
        
        for(let i = lonStart; i <= lonEnd; i += step) {
            lons.push(i);
        }
        
        // POST data JSON format example: {"points": [[12.3,45.6],[12.4,23.4]]}
        let postData = '{"points": [';
        for(let i = 0; i < lans.length - 1; i++) {
            postData += `[${parseFloat(lans[i].toFixed(5))},${parseFloat(lons[i].toFixed(5))}]${i != lans.length - 2 ? ',' : ''}`;
        }
        postData += ']}'
    
        let requestUrl = "https://elevation-api.io/api/elevation"
        fetch(requestUrl, {
            headers: { "Content-Type": "application/json; charset=utf-8" },
            method: 'POST',
            body: postData
        })
          .then(response => response.json())
          .then(data => {
            data.elevations.forEach(element => { this.elevations.push(element.elevation); });
        });
    }
}

let lat = 39.90974;
let lon = -106.17188;
let step = 0.00100;
let size = 250;

let elevationDataProvider = new ElevationDataProvider();
elevationDataProvider.GetElevationData(lat, lon, step, size)