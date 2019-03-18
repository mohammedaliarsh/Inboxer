local process = function(a, b, c)
    local e
    local d
    local f
    f = redis.call('zrange', a, 0, -1)
    local g = f[5]
    if g == nil then
        e = redis.call('zadd', a, b, c)
        return "item added";
    else
        e = redis.call('zadd', a, b, c)
        if e == 1 then
            d = redis.call('zremrangebyrank', a, 0, 0)
            return "new item added and old item deleted";
        else
            return "old item get updated timestamp";
        end
    end
end


local func_name = ARGV[3];
if (func_name == "process") then
    local x = KEYS[1]
    local y = ARGV[2]
    local z = ARGV[1]
    return process(x, y, z)
end