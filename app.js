document.addEventListener('DOMContentLoaded', function(){
  const nav = document.querySelector('nav');
  if(!nav) return;
  const onScroll = () => {
    if(window.scrollY > 12) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  const prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!prefersReduce){
    const photo = document.querySelector('.hero-photo.appear');
    const headline = document.querySelector('.hero-left .appear');
    if(photo) setTimeout(()=>photo.classList.add('show'), 120);
    if(headline) setTimeout(()=>headline.classList.add('show'), 320);
  } else {
    document.querySelectorAll('.appear').forEach(el=>el.classList.add('show'));
  }

  const revealEls = Array.from(document.querySelectorAll('section'));
  const onReveal = (entries, obs) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('show');
        obs.unobserve(entry.target);
      }
    });
  };
  if('IntersectionObserver' in window && !prefersReduce){
    const io = new IntersectionObserver(onReveal, {threshold:0.12});
    revealEls.forEach(el=>{
      el.classList.add('reveal');
      io.observe(el);
    });
  } else {
    revealEls.forEach(el=>el.classList.add('show'));
  }

  const weatherRoot = document.getElementById('weather');
  if(weatherRoot){
    const setLoading = (text) => { weatherRoot.textContent = text; };
    const setCard = (locationLabel, emoji, tempF, desc) => {
      weatherRoot.innerHTML = `
        <div class="weather-location">${locationLabel}</div>
        <div style="display:flex;align-items:center;gap:12px">
          <div class="weather-emoji" aria-hidden="true">${emoji}</div>
          <div style="display:flex;flex-direction:column">
            <div class="weather-temp">${Math.round(tempF)}°F</div>
            <div style="font-size:0.9rem;color:var(--text)">${desc}</div>
          </div>
        </div>`;
    };

    const codeToEmoji = (code) => {
      if(code === 0) return '☀️';
      if(code === 1 || code === 2) return '⛅';
      if(code === 3) return '☁️';
      if(code >= 45 && code <= 48) return '🌫️';
      if((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return '🌧️';
      if((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️';
      if(code >= 95 && code <= 99) return '⛈️';
      return '🌤️';
    };

    const codeToText = (code) => {
      if(code === 0) return 'Clear';
      if(code === 1 || code === 2) return 'Partly cloudy';
      if(code === 3) return 'Overcast';
      if(code >= 45 && code <= 48) return 'Fog';
      if((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Rain';
      if((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'Snow';
      if(code >= 95 && code <= 99) return 'Thunder';
      return 'Weather';
    };

    const fetchWeatherFor = (lat, lon, locationLabel) => {
      setLoading('Loading weather...');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`;
      fetch(url).then(r=>r.json()).then(data=>{
        if(!data || !data.current_weather){ setLoading('Weather unavailable'); return; }
        const cw = data.current_weather;
        const emoji = codeToEmoji(cw.weathercode);
        const desc = codeToText(cw.weathercode);
        setCard(locationLabel, emoji, cw.temperature, desc);
      }).catch(()=> setLoading('Weather error'));
    };

    const lookupLocation = (lat, lon, fallbackLabel = 'Miami') => {
      return fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`).then(r=>r.json()).then(data=>{
        if(data && (data.city || data.locality || data.principalSubdivision)){
          return data.city || data.locality || data.principalSubdivision || fallbackLabel;
        }
        return fallbackLabel;
      }).catch(()=> fallbackLabel);
    };

    if(navigator.geolocation){
      setLoading('Locating...');
      navigator.geolocation.getCurrentPosition(async pos=>{
        const lat = pos.coords.latitude, lon = pos.coords.longitude;
        const label = await lookupLocation(lat, lon, 'Miami');
        fetchWeatherFor(lat, lon, label);
      }, async err=>{
        if(err && err.code === 1){
          setLoading('Enable location to see your weather.');
        } else {
          setLoading('Location unavailable — showing Miami.');
        }
        const fallbackLat = 25.76, fallbackLon = -80.19;
        const label = 'Miami';
        fetchWeatherFor(fallbackLat, fallbackLon, label);
      }, {maximumAge:600000,timeout:8000});
    } else {
      fetchWeatherFor(25.76, -80.19, 'Miami');
    }
  }
});
