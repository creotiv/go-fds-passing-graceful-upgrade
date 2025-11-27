import http from "k6/http";
import { check } from "k6";

export const options = {
    vus: 100,
    duration: "30s",       // or longer, e.g. "2m"
    noConnectionReuse: false,

    dns: {
        ttl: "0",
        select: "random",
    },
};

// Service under NodePort:
const BASE_URL = "http://127.0.0.1:8080";

export default function () {
    const res = http.get(`${BASE_URL}/`);
    check(res, { "status 200": (r) => r.status === 200 });
}
