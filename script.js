document.getElementById('schrodingerForm').addEventListener('submit', function(event) {
    event.preventDefault();

    console.log("Form submitted");

    const rMin = parseFloat(document.getElementById('rMin').value);
    const rMax = parseFloat(document.getElementById('rMax').value);
    const numPoints = parseInt(document.getElementById('numPoints').value);
    const time = parseFloat(document.getElementById('time').value);
    const r0 = parseFloat(document.getElementById('r0').value);

    console.log({ rMin, rMax, numPoints, time, r0 });

    const isotopes = {
        "Protium": 1,
        "Deuterium": 1,
        "Tritium": 1
    };

    const r = linspace(rMin, rMax, numPoints);
    let results = '';

    for (const [isotope, Z] of Object.entries(isotopes)) {
        const TISE_energy = solveTISE(r, numPoints, Z);
        console.log(`Energy for ${isotope}: ${TISE_energy}`);
        results += `<p>Estimated energy for ${isotope} (TISE): ${TISE_energy}</p>`;

        const TDSE_prob_density = solveTDSE(r, time, numPoints, Z, r0);
        console.log(`Probability density for ${isotope}: ${TDSE_prob_density}`);
        results += `<p>Estimated probability density for ${isotope} (TDSE) at time ${time}: ${TDSE_prob_density}</p>`;
    }

    document.getElementById('results').innerHTML = results;
});

function linspace(start, end, num) {
    const step = (end - start) / (num - 1);
    return Array.from({ length: num }, (_, i) => start + (i * step));
}

function monteCarloIntegration(func, a, b, numPoints) {
    const points = Array.from({ length: numPoints }, () => Math.random() * (b - a) + a);
    const funcValues = points.map(func);
    const integral = (b - a) * (funcValues.reduce((a, b) => a + b, 0) / numPoints);
    return integral;
}

function hydrogenPotential(r) {
    return -1 / r;
}

function hydrogenWaveFunction(r, Z) {
    return Math.sqrt(Z**3 / Math.PI) * Math.exp(-Z * r);
}

function initialWaveFunction(r, r0) {
    return Math.exp(-((r - r0)**2));
}

function TDSEPropagator(r, t, Z) {
    return Math.exp(-1j * Z**2 * t / (2 * r**2));
}

function solveTISE(r, numPoints, Z) {
    const potential = r => hydrogenPotential(r);
    const waveFunction = r => hydrogenWaveFunction(r, Z);
    const integrand = r => potential(r) * waveFunction(r)**2;
    const energy = monteCarloIntegration(integrand, Math.min(...r), Math.max(...r), numPoints);
    return energy;
}

function solveTDSE(r, t, numPoints, Z, r0) {
    const initialWaveFunctionVals = r.map(r => initialWaveFunction(r, r0));
    const propagatorVals = r.map(r => TDSEPropagator(r, t, Z));
    const waveFunction = initialWaveFunctionVals.map((val, index) => val * propagatorVals[index]);
    const integrand = r => Math.abs(waveFunction[r])**2;
    const probabilityDensity = monteCarloIntegration(integrand, Math.min(...r), Math.max(...r), numPoints);
    return probabilityDensity;
}
