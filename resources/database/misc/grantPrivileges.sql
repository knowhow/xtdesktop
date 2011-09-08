-- Grant privileges for all desktop items to the admin user
INSERT INTO usrpriv (usrpriv_priv_id, usrpriv_username)
SELECT priv_id, current_user
FROM priv
WHERE (priv_module='Desktop')
EXCEPT  -- Not where the privilege has already been granted
SELECT xup.usrpriv_priv_id, xup.usrpriv_username
FROM usrpriv xup
  JOIN priv xp ON (xup.usrpriv_priv_id=xp.priv_id)
WHERE ((xup.usrpriv_username=current_user)
  AND (xp.priv_module='Desktop'));